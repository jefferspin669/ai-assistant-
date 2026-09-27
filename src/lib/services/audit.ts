import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { SessionContext } from "@/lib/domain/types";
import { database } from "@/lib/services/access";

export function writeAudit(
  ctx: SessionContext,
  input: { action: string; entityType: string; entityId?: string | null; actorLabel?: string },
) {
  const db = database();
  saveDatabase({
    ...db,
    audit_logs: [
      {
        id: newId("audit"),
        organization_id: ctx.organizationId,
        actor_user_id: ctx.userId,
        actor_label: input.actorLabel || ctx.userId,
        action: input.action,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        created_at: nowIso(),
      },
      ...db.audit_logs,
    ].slice(0, 500),
  });
}

export function listAudit(organizationId: string) {
  return database()
    .audit_logs.filter((row) => row.organization_id === organizationId)
    .slice(0, 80);
}
