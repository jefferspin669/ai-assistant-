import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { patchPolicy } from "../src/lib/autonomy/policy";
import { listAudit } from "../src/lib/services/audit";
import { orchestrate, tickRun, getRun, listCapabilities, planGoal, evaluateRules } from "../src/lib/orchestrator";
import { resetOrchestratorForTests, getTrace, listRuns } from "../src/lib/orchestrator/store";
import { compensateRun } from "../src/lib/orchestrator/saga";
import { routeEvent, subscribersFor } from "../src/lib/events/router";
import { laneForKind } from "../src/lib/queue/lanes";
import { invokeAdapter } from "../src/lib/integrations/adapters";
import type { OrchestratorRun } from "../src/lib/orchestrator/types";

describe("Atlas orchestrator", () => {
  beforeEach(() => {
    resetDatabase();
    resetOrchestratorForTests();
  });

  function owner() {
    const db = database();
    return testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
  }

  it("plans a new overdue-invoice goal without a hardcoded per-customer workflow", () => {
    const plan = planGoal("Get Johnson Construction's overdue invoice paid.", listCapabilities(owner()));
    expect(plan.intent).toBe("recover_invoice");
    expect(plan.steps.map((s) => s.label)).toEqual([
      "Find customer",
      "Find invoice",
      "Check payment history",
      "Determine best contact method",
      "Draft message",
      "Check business rules",
      "Request approval if required",
      "Send",
      "Wait 3 days",
      "Check payment",
      "Escalate if unpaid",
    ]);
  });

  it("runs the recover-invoice plan against live org data and waits instead of skipping ahead", async () => {
    const ctx = owner();
    patchPolicy(ctx.organizationId, { level: 2 });
    const { run, traceId } = await orchestrate(ctx, "Get Johnson Construction's overdue invoice paid.");
    expect(run.intent).toBe("recover_invoice");
    expect(run.organizationId).toBe(ctx.organizationId);
    const found = run.steps.find((s) => s.kind === "find_customer");
    expect(found?.status).toBe("done");
    expect(found?.result?.customerName).toBe("Johnson Construction");
    expect(run.steps.find((s) => s.kind === "find_invoice")?.status).toBe("done");
    expect(run.status).toBe("waiting");
    expect(run.steps.find((s) => s.kind === "wait")?.status).toBe("waiting");
    expect(run.steps.find((s) => s.kind === "escalate")?.status).toBe("pending");
    const trace = getTrace(traceId, ctx.organizationId);
    expect(trace?.spans.some((s) => s.name === "planner")).toBe(true);
    expect(listAudit(ctx.organizationId).some((row) => row.action.includes("orchestrator:start"))).toBe(true);
  });

  it("resumes a waiting run from persistent state after the wait elapses", async () => {
    const ctx = owner();
    patchPolicy(ctx.organizationId, { level: 2 });
    const { run } = await orchestrate(ctx, "Get Johnson Construction's overdue invoice paid.");
    const waiting = run.steps.find((s) => s.kind === "wait")!;
    waiting.waitUntil = new Date(Date.now() - 1000).toISOString();
    const resumed = await tickRun(run, { now: Date.now() });
    expect(resumed.steps.find((s) => s.kind === "wait")?.status).toBe("done");
    expect(resumed.steps.find((s) => s.kind === "escalate")?.status).toBe("done");
    expect(resumed.status).toBe("completed");
  });

  it("cannot complete Gmail send when the capability is disconnected", async () => {
    const ctx = owner();
    const gmail = listCapabilities(ctx).find((c) => c.id === "send_email");
    expect(gmail?.status).toBe("DISCONNECTED");
    const result = await invokeAdapter(ctx, "send_email", { to: "ap@johnsonconstruction.example", body: "hi" });
    expect(result.ok).toBe(false);
    expect(result.mode).toBe("blocked");
  });

  it("will not pretend payroll ran", () => {
    const payroll = listCapabilities(owner()).find((c) => c.id === "run_payroll");
    expect(payroll?.status).toBe("UNAVAILABLE");
  });

  it("business rules are not the same as permissions", () => {
    const ctx = owner();
    const refund = evaluateRules({
      organizationId: ctx.organizationId,
      kind: "refund",
      amountCents: 60_000,
    });
    expect(refund.some((row) => row.id === "refund_needs_approval" && row.needsApproval)).toBe(true);
    const late = evaluateRules({
      organizationId: ctx.organizationId,
      kind: "SEND_MESSAGE",
      channel: "sms",
      at: new Date("2026-08-31T22:15:00"),
    });
    expect(late.some((row) => row.id === "quiet_hours" && row.needsApproval)).toBe(true);
    const discount = evaluateRules({
      organizationId: ctx.organizationId,
      discountPercent: 20,
    });
    expect(discount.some((row) => row.id === "discount_cap" && !row.ok)).toBe(true);
    const deposit = evaluateRules({
      organizationId: ctx.organizationId,
      jobAmountCents: 1_500_000,
    });
    expect(deposit.some((row) => row.id === "job_deposit" && row.needsApproval)).toBe(true);
  });

  it("keeps Company B from reading Company A runs or traces", async () => {
    const ctx = owner();
    const { run, traceId } = await orchestrate(ctx, "Get Johnson Construction's overdue invoice paid.");
    expect(getRun(run.id, "org_other")).toBeNull();
    expect(getTrace(traceId, "org_other")).toBeNull();
    expect(listRuns("org_other")).toHaveLength(0);
  });

  it("compensates completed saga steps when a later step fails", () => {
    const ctx = owner();
    const run: OrchestratorRun = {
      id: "run_saga",
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      goal: "Charge, CRM, book, confirm",
      intent: "saga_demo",
      status: "running",
      cursor: 3,
      saga: { compensated: false, undone: [] },
      traceId: "tr_x",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      steps: [
        { id: "1", kind: "invoke", label: "Charge customer", status: "done", compensate: "refund", capability: "refund_payment" },
        { id: "2", kind: "invoke", label: "Update CRM", status: "done", compensate: "revert_crm" },
        { id: "3", kind: "invoke", label: "Create appointment", status: "done", compensate: "cancel_appointment" },
        { id: "4", kind: "invoke", label: "Send confirmation", status: "failed", error: "Twilio 500" },
      ],
    };
    const undone = compensateRun(run);
    expect(undone.saga.compensated).toBe(true);
    expect(undone.saga.undone).toEqual(["3", "2", "1"]);
    expect(undone.status).toBe("failed");
  });

  it("routes invoice.overdue into the orchestrator instead of a one-off reminder job", async () => {
    const ctx = owner();
    const event = {
      id: "evt_overdue",
      type: "invoice.overdue" as const,
      organizationId: ctx.organizationId,
      payload: { customerName: "Johnson Construction" },
      createdAt: new Date().toISOString(),
    };
    const route = subscribersFor(event);
    expect(route.orchestratorIntent).toBe("recover_invoice");
    expect(route.jobs).toEqual([]);
    await routeEvent(event);
    expect(listRuns(ctx.organizationId).some((row) => row.intent === "recover_invoice")).toBe(true);
  });

  it("keeps missed-call routing on the existing job (no second queue engine)", () => {
    const ctx = owner();
    const route = subscribersFor({
      id: "evt_missed",
      type: "call.missed",
      organizationId: ctx.organizationId,
      payload: { phone: "+15555550123" },
      createdAt: new Date().toISOString(),
    });
    expect(route.jobs).toEqual(["missed-call-follow-up"]);
    expect(laneForKind("missed-call-follow-up")).toBe("sms");
    expect(laneForKind("vendor_payment")).toBe("payment");
    expect(laneForKind("orchestrator:tick")).toBe("ai");
  });
});
