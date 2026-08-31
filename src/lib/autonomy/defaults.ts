import { nowIso } from "@/lib/db/store";
import type { DbAutonomyPolicy } from "@/lib/db/schema";
import type { AutonomyLevel, AutonomyPolicy } from "@/lib/autonomy/types";
import {
  DEFAULT_AUTO_PERMISSIONS,
  levelToControlMode,
  mergeAutoPermissions,
  type AutoPermissionKey,
  type ControlMode,
} from "@/lib/autonomy/permissions";

export function defaultPolicy(organizationId: string, stamp = nowIso()): AutonomyPolicy {
  return {
    organizationId,
    level: 1,
    controlMode: "manual",
    autoPermissions: { ...DEFAULT_AUTO_PERMISSIONS },
    killSwitch: false,
    autoPaymentLimitCents: 500_000,
    refundLimitCents: 10_000,
    discountCapPercent: 10,
    marketingBudgetCents: 150_000,
    earliestScheduleHour: 8,
    wakeOnlyEmergencies: true,
    standingOrders: [
      "Never discount more than 10% without approval.",
      "Do not schedule before 8:00 AM without approval.",
      "Wake the owner only for true emergencies.",
    ],
    updatedAt: stamp,
  };
}

export function toRow(policy: AutonomyPolicy): DbAutonomyPolicy {
  return {
    organization_id: policy.organizationId,
    level: policy.level,
    control_mode: policy.controlMode,
    auto_permissions: policy.autoPermissions,
    kill_switch: policy.killSwitch,
    auto_payment_limit_cents: policy.autoPaymentLimitCents,
    refund_limit_cents: policy.refundLimitCents,
    discount_cap_percent: policy.discountCapPercent,
    marketing_budget_cents: policy.marketingBudgetCents,
    earliest_schedule_hour: policy.earliestScheduleHour,
    wake_only_emergencies: policy.wakeOnlyEmergencies,
    standing_orders: policy.standingOrders,
    updated_at: policy.updatedAt,
  };
}

function parseAutoPermissions(raw: unknown): Record<AutoPermissionKey, boolean> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return mergeAutoPermissions(undefined, raw as Partial<Record<AutoPermissionKey, boolean>>);
  }
  return { ...DEFAULT_AUTO_PERMISSIONS };
}

function parseControlMode(raw: unknown, level: AutonomyLevel): ControlMode {
  if (raw === "manual" || raw === "assisted" || raw === "autonomous") return raw;
  return levelToControlMode(level);
}

export function fromRow(row: DbAutonomyPolicy): AutonomyPolicy {
  const level = ([1, 2, 3, 4].includes(row.level) ? row.level : 1) as AutonomyLevel;
  const controlMode = parseControlMode(row.control_mode, level);
  return {
    organizationId: row.organization_id,
    level,
    controlMode,
    autoPermissions: parseAutoPermissions(row.auto_permissions),
    killSwitch: Boolean(row.kill_switch),
    autoPaymentLimitCents: row.auto_payment_limit_cents,
    refundLimitCents: row.refund_limit_cents,
    discountCapPercent: row.discount_cap_percent,
    marketingBudgetCents: row.marketing_budget_cents,
    earliestScheduleHour: row.earliest_schedule_hour,
    wakeOnlyEmergencies: Boolean(row.wake_only_emergencies),
    standingOrders: row.standing_orders || [],
    updatedAt: row.updated_at,
  };
}
