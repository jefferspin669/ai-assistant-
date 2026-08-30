import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { SessionContext } from "@/lib/domain/types";
import type { AtlasAction } from "@/lib/domain/schemas";
import { decideWork } from "@/lib/autonomy/engine";
import { getPolicy } from "@/lib/autonomy/policy";
import type { AutonomyDecision, AutonomyKind, WorkIntent } from "@/lib/autonomy/types";
import { database, requireOrgMember } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import { enqueueJob, notify } from "@/lib/services/jobs";

export type SubmittedWork = {
  decision: AutonomyDecision;
  approvalId?: string;
  jobId?: string;
};

function withAction(action: AtlasAction, extra?: Record<string, unknown>): Record<string, unknown> {
  return { ...extra, atlasAction: action };
}

export function intentFromAtlasAction(action: AtlasAction): WorkIntent {
  switch (action.type) {
    case "CREATE_APPOINTMENT":
      return {
        kind: "schedule_appointment",
        title: "Book appointment",
        summary: action.payload.title || "Calendar booking",
        payload: withAction(action, action.payload),
      };
    case "MOVE_APPOINTMENT":
      return {
        kind: "fill_canceled_slot",
        title: "Move appointment",
        summary: "Reschedule on the calendar",
        payload: withAction(action, action.payload),
      };
    case "SEND_MESSAGE":
      return {
        kind: "basic_message",
        title: "Customer text",
        summary: action.payload.message.slice(0, 140),
        payload: withAction(action, action.payload),
      };
    case "CREATE_QUOTE":
      return {
        kind: "apply_discount",
        title: "Create quote",
        summary: `Quote $${action.payload.amount}`,
        amountCents: Math.round(action.payload.amount * 100),
        payload: withAction(action, action.payload),
      };
    case "REQUEST_PAYMENT":
      return {
        kind: "invoice_reminder",
        title: "Request payment",
        summary: `Payment $${action.payload.amount}`,
        amountCents: Math.round(action.payload.amount * 100),
        payload: withAction(action, action.payload),
      };
    case "REFUND_CUSTOMER":
      return {
        kind: "refund",
        title: "Customer refund",
        summary: `Refund $${action.payload.amount}`,
        amountCents: Math.round(action.payload.amount * 100),
        payload: withAction(action, action.payload),
      };
    default:
      return {
        kind: "assign_task",
        title: action.type,
        summary: action.type,
        payload: withAction(action, action.payload as Record<string, unknown>),
      };
  }
}

export type SubmitWorkOptions = {
  /** When false, a within-authority intent is not queued — caller executes immediately. */
  enqueueOnExecute?: boolean;
};

export function submitWork(
  ctx: SessionContext,
  intent: WorkIntent,
  options: SubmitWorkOptions = {},
): SubmittedWork {
  const db = database();
  requireOrgMember(db, ctx);
  const policy = getPolicy(ctx.organizationId);
  const decision = decideWork(intent, policy);

  writeAudit(ctx, {
    action: `autonomy:${decision.verdict}:${intent.kind}`,
    entityType: "autonomy",
    entityId: ctx.organizationId,
    actorLabel: "Atlas",
  });

  if (decision.verdict === "execute") {
    if (options.enqueueOnExecute === false) return { decision };
    const job = enqueueJob(ctx, `autonomy:${intent.kind}`, {
      ...intent.payload,
      userId: ctx.userId,
      title: intent.title,
    });
    return { decision, jobId: job.id };
  }

  const approval = {
    id: newId("appr"),
    organization_id: ctx.organizationId,
    requested_by: ctx.userId,
    action_type: intent.kind,
    payload: {
      ...intent.payload,
      title: intent.title,
      summary: intent.summary,
      amountCents: intent.amountCents ?? null,
      limitCents: decision.limitCents ?? null,
      ownerPrompt: decision.ownerPrompt,
      band: decision.band,
      originalKind: intent.kind,
    },
    status: "pending" as const,
    created_at: nowIso(),
    resolved_at: null,
  };
  saveDatabase({ ...database(), approvals: [approval, ...database().approvals] });
  notify(ctx, "Atlas needs you", intent.title);
  writeAudit(ctx, {
    action: `requested ${intent.kind}`,
    entityType: "approval",
    entityId: approval.id,
    actorLabel: "Atlas",
  });
  return { decision, approvalId: approval.id };
}

export function demoVendorPayment(ctx: SessionContext): SubmittedWork {
  return submitWork(ctx, {
    kind: "vendor_payment" as AutonomyKind,
    title: "Vendor payment",
    summary: "Supplier invoice from HVAC Parts Co.",
    amountCents: 1_842_000,
    payload: { vendor: "HVAC Parts Co", memo: "Compressor restock" },
  });
}

export function pendingAutonomyCards(organizationId: string) {
  return database()
    .approvals.filter((row) => row.organization_id === organizationId && row.status === "pending")
    .map((row) => ({
      id: row.id,
      kind: String(row.payload.originalKind || row.action_type),
      title: String(row.payload.title || row.action_type),
      summary: String(row.payload.summary || ""),
      ownerPrompt: String(row.payload.ownerPrompt || ""),
      amountCents: typeof row.payload.amountCents === "number" ? row.payload.amountCents : null,
      limitCents: typeof row.payload.limitCents === "number" ? row.payload.limitCents : null,
      band: String(row.payload.band || ""),
      createdAt: row.created_at,
      status: row.status,
    }));
}

export function askAtlasAboutApproval(ctx: SessionContext, approvalId: string) {
  const db = database();
  requireOrgMember(db, ctx);
  const row = db.approvals.find(
    (item) => item.id === approvalId && item.organization_id === ctx.organizationId,
  );
  if (!row) return null;
  const prompt = String(row.payload.ownerPrompt || row.payload.summary || "This is waiting on you.");
  notify(ctx, "Atlas reply", prompt);
  writeAudit(ctx, {
    action: "asked Atlas about approval",
    entityType: "approval",
    entityId: row.id,
  });
  return {
    reply: prompt,
    approvalId: row.id,
    title: String(row.payload.title || row.action_type),
  };
}
