import type { DbSubscription } from "@/lib/db/schema";
import { loadDatabase } from "@/lib/db/store";
import type { AutonomyLevel } from "@/lib/autonomy/types";

export type AtlasPlan = DbSubscription["plan"];

const MAX_LEVEL: Record<AtlasPlan, AutonomyLevel> = {
  free: 1,
  pro: 2,
  business: 4,
  enterprise: 4,
};

const SEAT_CAPS: Record<AtlasPlan, number> = {
  free: 1,
  pro: 5,
  business: 25,
  enterprise: 500,
};

export function subscriptionForOrg(organizationId: string): DbSubscription | null {
  return loadDatabase().subscriptions.find((row) => row.orgId === organizationId) || null;
}

export function maxAutonomyLevelForPlan(plan: AtlasPlan): AutonomyLevel {
  return MAX_LEVEL[plan] || 1;
}

export function planAllowsAutonomyLevel(plan: AtlasPlan, level: AutonomyLevel): boolean {
  return level <= maxAutonomyLevelForPlan(plan);
}

export function seatCapForPlan(plan: AtlasPlan): number {
  return SEAT_CAPS[plan] || 1;
}

export function assertSeatAvailable(organizationId: string): { ok: true } | { ok: false; cap: number; used: number } {
  const sub = subscriptionForOrg(organizationId);
  const plan = sub?.plan || "free";
  const cap = Math.max(sub?.seats || 0, seatCapForPlan(plan));
  const used = loadDatabase().organization_members.filter(
    (row) => row.organization_id === organizationId && row.status === "active",
  ).length;
  if (used >= cap) return { ok: false, cap, used };
  return { ok: true };
}
