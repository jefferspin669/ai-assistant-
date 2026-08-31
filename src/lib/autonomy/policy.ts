import { nowIso, saveDatabase } from "@/lib/db/store";
import type { DbAutonomyPolicy } from "@/lib/db/schema";
import { database } from "@/lib/services/access";
import { levelFromAwayPhrase } from "@/lib/autonomy/engine";
import { defaultPolicy, fromRow, toRow } from "@/lib/autonomy/defaults";
import type { AutonomyPolicy } from "@/lib/autonomy/types";
import { maxAutonomyLevelForPlan, subscriptionForOrg } from "@/lib/billing/entitlements";

export { defaultPolicy };

export function getPolicy(organizationId: string): AutonomyPolicy {
  const db = database();
  const policies = db.autonomy_policies || [];
  const row = policies.find((item) => item.organization_id === organizationId);
  if (row) return fromRow(row);
  const created = defaultPolicy(organizationId);
  saveDatabase({
    ...db,
    autonomy_policies: [toRow(created), ...policies],
  });
  return created;
}

export function savePolicy(next: AutonomyPolicy): AutonomyPolicy {
  const db = database();
  const policies = db.autonomy_policies || [];
  const plan = subscriptionForOrg(next.organizationId)?.plan || "free";
  const maxLevel = maxAutonomyLevelForPlan(plan);
  const clamped = next.level > maxLevel ? { ...next, level: maxLevel } : next;
  const row = toRow({ ...clamped, updatedAt: nowIso() });
  const exists = policies.some((item) => item.organization_id === next.organizationId);
  saveDatabase({
    ...db,
    autonomy_policies: exists
      ? policies.map((item) => (item.organization_id === next.organizationId ? row : item))
      : [row, ...policies],
  });
  return fromRow(row);
}

export function patchPolicy(
  organizationId: string,
  patch: Partial<Omit<AutonomyPolicy, "organizationId">>,
): AutonomyPolicy {
  const current = getPolicy(organizationId);
  return savePolicy({ ...current, ...patch, organizationId });
}

export function applyAwayMode(organizationId: string, message: string): AutonomyPolicy {
  const current = getPolicy(organizationId);
  const orders = [...current.standingOrders];
  if (message.trim() && !orders.includes(message.trim())) orders.unshift(message.trim());
  return savePolicy({
    ...current,
    level: levelFromAwayPhrase(message),
    killSwitch: false,
    standingOrders: orders.slice(0, 12),
    wakeOnlyEmergencies: /emergency|wake me/i.test(message) || current.wakeOnlyEmergencies,
  });
}

export function appendStandingOrder(organizationId: string, order: string): AutonomyPolicy {
  const current = getPolicy(organizationId);
  const text = order.trim();
  if (!text) return current;
  const standingOrders = [text, ...current.standingOrders.filter((item) => item !== text)].slice(0, 12);
  return savePolicy({ ...current, standingOrders });
}

export function seedPolicyRow(organizationId: string, stamp: string): DbAutonomyPolicy {
  return toRow(defaultPolicy(organizationId, stamp));
}
