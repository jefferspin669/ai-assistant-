import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { SessionContext } from "@/lib/domain/types";
import type { AtlasAction } from "@/lib/domain/schemas";
import { database, requireOrgMember } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import { notify } from "@/lib/services/jobs";
import { hasPermission } from "@/lib/auth/permissions";
import { authorizeAction } from "@/backend/permissions/engine";

const SENSITIVE = new Set(["SEND_MESSAGE", "CREATE_QUOTE", "REQUEST_PAYMENT", "REFUND_CUSTOMER"]);

export function requiresApproval(
  type: AtlasAction["type"],
  ctx: SessionContext,
  payload?: Record<string, unknown>,
) {
  if (type === "REFUND_CUSTOMER") {
    const amount = Number(payload?.amount);
    if (!Number.isFinite(amount) || amount <= 0) return true;
    return authorizeAction({ action: "refund", amount }).permission === "OWNER_APPROVAL_REQUIRED";
  }
  if (!SENSITIVE.has(type)) return false;
  return !hasPermission(ctx, "atlas.autonomous");
}

export function createApproval(ctx: SessionContext, action: AtlasAction) {
  const db = database();
  requireOrgMember(db, ctx);
  const row = {
    id: newId("appr"),
    organization_id: ctx.organizationId,
    requested_by: ctx.userId,
    action_type: action.type,
    payload: action.payload as Record<string, unknown>,
    status: "pending" as const,
    created_at: nowIso(),
    resolved_at: null,
  };
  saveDatabase({ ...db, approvals: [row, ...db.approvals] });
  notify(ctx, `Approval needed: ${action.type}`, "Atlas queued a sensitive action.");
  writeAudit(ctx, { action: `requested ${action.type}`, entityType: "approval", entityId: row.id });
  return row;
}

export function listApprovals(ctx: SessionContext) {
  const db = database();
  requireOrgMember(db, ctx);
  return db.approvals.filter((row) => row.organization_id === ctx.organizationId);
}
