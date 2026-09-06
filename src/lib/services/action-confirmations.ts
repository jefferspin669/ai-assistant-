import { z } from "zod";
import { AuthorizationError, NotFoundError, ValidationError } from "@/lib/domain/errors";
import type { SessionContext } from "@/lib/domain/types";
import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import { database, requireOrgMember } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import { assertHumanApproval } from "@/lib/safety/guards";

export const ACTION_SMS = "SEND_SMS";
export const ACTION_INVOICE = "SEND_INVOICE";

const smsPayloadSchema = z.object({
  to: z.string().min(3).max(40),
  body: z.string().min(1).max(1600),
});

const invoicePayloadSchema = z.object({
  customerName: z.string().min(1).max(200),
  amountCents: z.number().int().positive().max(50_000_000),
  customerPhone: z.string().max(40).optional(),
  customerEmail: z.string().email().max(200).optional(),
  memo: z.string().max(500).optional(),
});

export function stageActionApproval(
  ctx: SessionContext,
  actionType: typeof ACTION_SMS | typeof ACTION_INVOICE,
  payload: Record<string, unknown>,
) {
  requireOrgMember(database(), ctx);
  assertHumanApproval(ctx);
  if (actionType === ACTION_SMS) smsPayloadSchema.parse(payload);
  if (actionType === ACTION_INVOICE) invoicePayloadSchema.parse(payload);

  const db = database();
  const row = {
    id: newId("appr"),
    organization_id: ctx.organizationId,
    requested_by: ctx.userId,
    action_type: actionType,
    payload,
    status: "pending" as const,
    created_at: nowIso(),
    resolved_at: null,
  };
  saveDatabase({ ...db, approvals: [row, ...db.approvals] });
  writeAudit(ctx, {
    action: `requested ${actionType}`,
    entityType: "approval",
    entityId: row.id,
  });
  return row;
}

/**
 * Verify a server-side approval that a human already marked approved.
 * Never trust a client `approved: true` flag.
 * Consumes the approval (rejected replay) by flipping status to a terminal used state via resolved stamp + status keep approved with payload.usedAt.
 */
export function consumeApprovedConfirmation(
  ctx: SessionContext,
  confirmationId: string | undefined,
  expectedType: typeof ACTION_SMS | typeof ACTION_INVOICE,
) {
  if (!confirmationId?.trim()) {
    throw new ValidationError("confirmationId is required. Client-side approved flags are ignored.");
  }
  assertHumanApproval(ctx);
  const db = database();
  requireOrgMember(db, ctx);
  const row = db.approvals.find(
    (item) => item.id === confirmationId && item.organization_id === ctx.organizationId,
  );
  if (!row) throw new NotFoundError("Confirmation not found.");
  if (row.action_type !== expectedType) {
    throw new AuthorizationError(`Confirmation is for ${row.action_type}, not ${expectedType}.`);
  }
  if (row.status !== "approved") {
    throw new AuthorizationError("Confirmation is not approved.");
  }
  if (row.payload && row.payload.consumedAt) {
    throw new AuthorizationError("Confirmation was already used.");
  }

  const consumed = {
    ...row,
    payload: { ...row.payload, consumedAt: nowIso(), consumedBy: ctx.userId },
  };
  saveDatabase({
    ...db,
    approvals: db.approvals.map((item) => (item.id === row.id ? consumed : item)),
  });
  writeAudit(ctx, {
    action: `consumed ${expectedType} confirmation`,
    entityType: "approval",
    entityId: row.id,
  });
  return consumed;
}

export { smsPayloadSchema, invoicePayloadSchema };
