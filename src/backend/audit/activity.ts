import { listAudit, writeAudit } from "@/lib/services/audit";
import type { SessionContext } from "@/lib/domain/types";

/** Owner-readable activity line, e.g. "08:16 Created customer: John Smith." */
export function formatActivityLine(row: {
  created_at: string;
  actor_label: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
}) {
  const time = new Date(row.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const who = row.actor_label || "Atlas";
  return `${time} ${who} ${row.action}${row.entity_id ? ` (${row.entity_type} ${row.entity_id})` : ""}.`;
}

export function listActivity(organizationId: string) {
  return listAudit(organizationId).map((row) => ({
    ...row,
    line: formatActivityLine(row),
  }));
}

export function recordActivity(
  ctx: SessionContext,
  input: { action: string; entityType: string; entityId?: string | null; actorLabel?: string },
) {
  return writeAudit(ctx, input);
}
