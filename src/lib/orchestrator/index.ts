/**
 * Atlas Orchestrator — coordinates existing Actions, Approvals, Audit, Jobs, and Events.
 * Does not replace those systems.
 */

import { newId, nowIso } from "@/lib/db/store";
import type { SessionContext } from "@/lib/domain/types";
import { database, requireOrgMember } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import { notify } from "@/lib/services/jobs";
import { submitWork } from "@/lib/autonomy/submit";
import { getPolicy } from "@/lib/autonomy/policy";
import { executeAtlasAction } from "@/lib/domain/actions";
import { listCapabilities, assertCapabilityAvailable, getCapability, canUseCapability } from "@/lib/capabilities/registry";
import { evaluateRules, rulesBlock, rulesNeedApproval } from "@/lib/rules/engine";
import { planGoal } from "@/lib/orchestrator/planner";
import { compensateRun } from "@/lib/orchestrator/saga";
import { dueRuns, getRun, listRuns, saveRun } from "@/lib/orchestrator/store";
import { addSpan, finishTrace, startTrace } from "@/lib/observability/trace";
import { invokeAdapter } from "@/lib/integrations/adapters";
import type { OrchestratorRun, RunStep } from "@/lib/orchestrator/types";

export { listCapabilities, getCapability, assertCapabilityAvailable };
export { planGoal };
export { listRuns, getRun };
export { evaluateRules };

function customerQuery(goal: string) {
  const possessive = goal.match(/\b([A-Za-z][A-Za-z0-9 &.'-]*?)(?:'s)\s+(?:overdue|invoice|unpaid)/i);
  if (possessive?.[1]) return possessive[1].trim();
  const named = goal.match(/\bfor\s+([A-Za-z][A-Za-z0-9 &.'-]+?)(?:'s|\s+overdue|\s+invoice|,|\.|$)/i);
  if (named?.[1]) return named[1].trim();
  return "";
}

function mark(step: RunStep, status: RunStep["status"], result?: Record<string, unknown>, error?: string) {
  step.status = status;
  if (result) step.result = result;
  if (error) step.error = error;
}

function ctxFromRun(run: OrchestratorRun): SessionContext {
  return {
    userId: run.userId,
    organizationId: run.organizationId,
    role: "owner",
    sessionId: "orchestrator",
  };
}

async function executeStep(run: OrchestratorRun, step: RunStep, ctx: SessionContext) {
  const db = database();
  const state = run.steps.reduce<Record<string, unknown>>((acc, item) => ({ ...acc, ...(item.result || {}) }), {});

  if (step.kind === "find_customer") {
    const q = String(state.customerQuery || customerQuery(run.goal) || "").toLowerCase();
    const inOrg = db.customers.filter((row) => row.organization_id === ctx.organizationId);
    const match =
      inOrg.find((row) => q && row.name.toLowerCase().includes(q)) ||
      inOrg.find((row) => row.name.trim() && run.goal.toLowerCase().includes(row.name.toLowerCase())) ||
      null;
    if (!match) {
      mark(step, "failed", undefined, "Customer not found in this organization.");
      return;
    }
    mark(step, "done", {
      customerQuery: q,
      customerId: match.id,
      customerName: match.name,
      phone: match.phone,
      email: match.email,
    });
    return;
  }

  if (step.kind === "find_invoice") {
    const customerId = String(state.customerId || "");
    const name = String(state.customerName || "");
    const invoice =
      db.transactions.find(
        (row) =>
          row.orgId === ctx.organizationId &&
          row.kind === "income" &&
          (row.category === "invoice" || /invoice/i.test(row.label)) &&
          (!name || row.label.toLowerCase().includes(name.toLowerCase())),
      ) || null;
    if (!invoice) {
      mark(step, "failed", { customerId }, "No invoice found for this customer.");
      return;
    }
    const ageDays = (Date.now() - new Date(invoice.date).getTime()) / 86400000;
    mark(step, "done", {
      invoiceId: invoice.id,
      invoiceLabel: invoice.label,
      amount: invoice.amount,
      amountCents: Math.round(invoice.amount * 100),
      overdue: ageDays > 30 || /overdue/i.test(invoice.label),
    });
    return;
  }

  if (step.kind === "inspect") {
    const paid = db.transactions.some(
      (row) =>
        row.orgId === ctx.organizationId &&
        row.kind === "income" &&
        /payment|paid/i.test(row.label) &&
        String(state.customerName || "") &&
        row.label.toLowerCase().includes(String(state.customerName).toLowerCase()),
    );
    mark(step, "done", { alreadyPaid: paid, history: paid ? "payment recorded" : "no payment yet" });
    return;
  }

  if (step.kind === "choose_channel") {
    const sms = assertCapabilityAvailable(getCapability(ctx, "send_sms"), "send_sms");
    const email = assertCapabilityAvailable(getCapability(ctx, "send_email"), "send_email");
    const channel = sms.ok ? "send_sms" : email.ok ? "send_email" : null;
    if (!channel) {
      mark(step, "blocked", { sms: sms.ok, email: email.ok }, "No reachable messaging capability.");
      return;
    }
    mark(step, "done", { channel, to: channel === "send_sms" ? state.phone : state.email });
    return;
  }

  if (step.kind === "draft") {
    const amount = state.amount ? `$${Number(state.amount).toFixed(2)}` : "an open invoice";
    const body = `Hi, this is Atlas for the shop. ${state.invoiceLabel || "Your invoice"} (${amount}) is still open. Reply here and we will get you a copy or a payment link.`;
    mark(step, "done", { message: body });
    return;
  }

  if (step.kind === "evaluate_rules") {
    const channel = state.channel === "send_email" ? "email" : "sms";
    const verdicts = evaluateRules({
      organizationId: ctx.organizationId,
      kind: "SEND_MESSAGE",
      channel,
      amountCents: typeof state.amountCents === "number" ? state.amountCents : undefined,
    });
    const blocked = rulesBlock(verdicts);
    if (blocked) {
      mark(step, "blocked", { verdicts }, blocked.reason);
      return;
    }
    mark(step, "done", { verdicts, needsApproval: rulesNeedApproval(verdicts) });
    return;
  }

  if (step.kind === "approval") {
    const policy = getPolicy(ctx.organizationId);
    if (policy.killSwitch) {
      mark(step, "blocked", {}, "Kill switch is on.");
      return;
    }
    const needs = Boolean(state.needsApproval) || policy.level <= 1;
    if (!needs) {
      mark(step, "skipped", { reason: "Within Atlas authority" });
      return;
    }
    const submitted = submitWork(ctx, {
      kind: "invoice_reminder",
      title: run.goal.slice(0, 80),
      summary: String(state.message || run.goal),
      amountCents: typeof state.amountCents === "number" ? state.amountCents : undefined,
      payload: { runId: run.id, customerId: state.customerId },
    });
    if (submitted.decision.verdict !== "execute") {
      mark(step, "blocked", { approvalId: submitted.approvalId, decision: submitted.decision }, "Waiting on owner approval.");
      return;
    }
    mark(step, "done", { approvalId: submitted.approvalId, auto: true });
    return;
  }

  if (step.kind === "invoke") {
    const capabilityId = step.capability || String(state.channel || "");
    const cap = getCapability(ctx, capabilityId);
    const allowed = cap ? canUseCapability(ctx, cap) : { ok: false as const, reason: "Unknown capability" };
    if (!allowed.ok) {
      mark(step, "failed", { capabilityId }, allowed.reason);
      return;
    }
    if (capabilityId === "calendar_create" && state.customerId) {
      const start = new Date(Date.now() + 86400000);
      const created = executeAtlasAction(
        {
          type: "CREATE_APPOINTMENT",
          payload: {
            customerId: String(state.customerId),
            startTime: start.toISOString(),
            endTime: new Date(start.getTime() + 3600000).toISOString(),
            title: String(state.customerName || "Appointment"),
          },
        },
        ctx,
      );
      mark(step, "done", { capabilityId, created: created.type });
      return;
    }
    if (state.customerId && (capabilityId === "send_sms" || capabilityId === "send_email")) {
      const sent = executeAtlasAction(
        {
          type: "SEND_MESSAGE",
          payload: { customerId: String(state.customerId), message: String(state.message || "Atlas follow-up") },
        },
        ctx,
      );
      if ("requiresApproval" in sent && sent.requiresApproval && sent.approvalId && sent.approvalId !== "executed") {
        mark(step, "blocked", { approvalId: sent.approvalId, capabilityId }, "Send is waiting on approval.");
        return;
      }
      mark(step, "done", { capabilityId, via: "atlas-actions", queued: "queued" in sent ? sent.queued : false });
      return;
    }
    const invoked = await invokeAdapter(ctx, capabilityId, {
      to: state.to || state.phone || state.email,
      phone: state.phone,
      email: state.email,
      body: state.message,
      message: state.message,
      customerName: state.customerName,
      amountCents: state.amountCents,
      approved: true,
    });
    if (!invoked.ok) {
      mark(step, "failed", { capabilityId, invoked }, invoked.error);
      return;
    }
    mark(step, "done", { capabilityId, invoked });
    return;
  }

  if (step.kind === "wait") {
    const hours = step.waitHours ?? 72;
    if (hours <= 0) {
      mark(step, "skipped", { reason: "wait disabled" });
      return;
    }
    if (step.waitUntil && new Date(step.waitUntil).getTime() > Date.now()) {
      mark(step, "waiting", { waitUntil: step.waitUntil });
      return;
    }
    if (!step.waitUntil) {
      const waitUntil = new Date(Date.now() + hours * 3600_000).toISOString();
      step.waitUntil = waitUntil;
      mark(step, "waiting", { waitUntil });
      return;
    }
    mark(step, "done", { waitedUntil: step.waitUntil });
    return;
  }

  if (step.kind === "check_payment") {
    const paid = Boolean(state.alreadyPaid);
    mark(step, "done", { paid, unpaid: !paid });
    return;
  }

  if (step.kind === "escalate") {
    if (state.paid) {
      mark(step, "skipped", { reason: "Invoice already paid" });
      return;
    }
    notify(ctx, "Atlas needs you", `${run.goal} — still unpaid after the wait.`);
    writeAudit(ctx, {
      action: "orchestrator:escalate",
      entityType: "run",
      entityId: run.id,
      actorLabel: "Atlas Orchestrator",
    });
    mark(step, "done", { escalated: true });
    return;
  }

  if (step.kind === "compensate") {
    compensateRun(run);
    mark(step, "done", { compensated: true });
  }
}

export async function tickRun(run: OrchestratorRun, options: { now?: number } = {}): Promise<OrchestratorRun> {
  const ctx = ctxFromRun(run);
  requireOrgMember(database(), ctx);
  const policy = getPolicy(ctx.organizationId);
  if (policy.killSwitch) {
    run.status = "blocked";
    run.updatedAt = nowIso();
    return saveRun(run);
  }

  while (run.cursor < run.steps.length) {
    const step = run.steps[run.cursor];
    if (!step) break;
    if (step.status === "done" || step.status === "skipped") {
      run.cursor += 1;
      continue;
    }
    if (step.kind === "wait" && step.waitUntil && new Date(step.waitUntil).getTime() > (options.now || Date.now())) {
      step.status = "waiting";
      run.status = "waiting";
      run.updatedAt = nowIso();
      return saveRun(run);
    }
    await executeStep(run, step, ctx);
    if (step.status === "waiting") {
      run.status = "waiting";
      run.updatedAt = nowIso();
      return saveRun(run);
    }
    if (step.status === "blocked") {
      run.status = "blocked";
      run.updatedAt = nowIso();
      return saveRun(run);
    }
    if (step.status === "failed") {
      if (step.compensate) compensateRun(run);
      else {
        run.status = "failed";
        run.updatedAt = nowIso();
        saveRun(run);
      }
      return getRun(run.id, run.organizationId) || run;
    }
    run.cursor += 1;
  }

  run.status = "completed";
  run.updatedAt = nowIso();
  return saveRun(run);
}

export async function orchestrate(
  ctx: SessionContext,
  goal: string,
  options: { waitHours?: number } = {},
): Promise<{ run: OrchestratorRun; traceId: string }> {
  requireOrgMember(database(), ctx);
  const capabilities = listCapabilities(ctx);
  const planned = planGoal(goal, capabilities);
  const trace = startTrace({
    id: newId("tr"),
    organizationId: ctx.organizationId,
    goal,
  });
  addSpan(trace, "orchestrator", true, "intent " + planned.intent);
  addSpan(trace, "planner", true, planned.steps.map((s) => s.label).join(" → "));
  addSpan(trace, "capability_registry", true, `${capabilities.filter((c) => c.status !== "UNAVAILABLE").length} usable`);

  const steps: RunStep[] = planned.steps.map((item) => ({
    ...item,
    status: "pending",
    waitHours: item.kind === "wait" ? (options.waitHours ?? item.waitHours) : item.waitHours,
  }));

  const run: OrchestratorRun = {
    id: newId("run"),
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    goal,
    intent: planned.intent,
    status: "running",
    steps,
    cursor: 0,
    saga: { compensated: false, undone: [] },
    traceId: trace.id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  trace.runId = run.id;
  saveRun(run);
  writeAudit(ctx, {
    action: `orchestrator:start:${planned.intent}`,
    entityType: "run",
    entityId: run.id,
    actorLabel: "Atlas Orchestrator",
  });

  const next = await tickRun(run);
  trace.actions = next.steps.filter((s) => s.kind === "invoke" && s.status === "done").length;
  addSpan(trace, "runtime", next.status !== "failed", next.status);
  finishTrace(trace);
  return { run: next, traceId: trace.id };
}

export async function tickDueOrchestratorRuns() {
  const due = dueRuns();
  const results = [];
  for (const run of due) {
    results.push(await tickRun(run));
  }
  return results;
}

export function looksLikeOrchestratorGoal(message: string) {
  const q = message.toLowerCase();
  return (
    /overdue|unpaid|invoice paid|collect/.test(q) ||
    /missed call/.test(q) ||
    /get .+ paid/.test(q)
  );
}
