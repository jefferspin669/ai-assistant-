/**
 * Business rules — operating policy for a company.
 * Permissions answer "is this person allowed?" Rules answer "does this company allow this action?"
 * Reads existing autonomy policy (discount cap, refund limit, quiet hours) rather than a second DNA store.
 * Project rules: workers (employees) may only update tasks assigned to them.
 */

import { AuthorizationError } from "@/lib/domain/errors";
import { getPolicy } from "@/lib/autonomy/policy";
import type { DbTask } from "@/lib/db/schema";
import type { OrgRole, SessionContext } from "@/lib/domain/types";
import type { RuleVerdict } from "@/lib/orchestrator/types";

export type RuleContext = {
  organizationId: string;
  kind?: string;
  amountCents?: number;
  discountPercent?: number;
  channel?: "sms" | "email" | "call" | "other";
  at?: Date;
  jobAmountCents?: number;
};

const MANAGER_PLUS: OrgRole[] = ["owner", "admin", "manager"];

export function isWorkerRole(role: OrgRole): boolean {
  return role === "employee";
}

export function canManageProjectTasks(role: OrgRole): boolean {
  return MANAGER_PLUS.includes(role);
}

/**
 * Project-level rule: employees may only mutate tasks assigned to them.
 * Managers/owners/admins may update any org task.
 */
export function assertWorkerCanUpdateTask(ctx: SessionContext, task: DbTask): void {
  if (canManageProjectTasks(ctx.role)) return;
  if (isWorkerRole(ctx.role)) {
    if (task.assigneeId && task.assigneeId === ctx.userId) return;
    throw new AuthorizationError("Workers can only update tasks assigned to them.");
  }
  throw new AuthorizationError("You cannot update this task.");
}

export function workerCanReadTask(ctx: SessionContext, task: DbTask): boolean {
  if (canManageProjectTasks(ctx.role) || ctx.role === "viewer" || ctx.role === "accountant") {
    return true;
  }
  if (isWorkerRole(ctx.role)) {
    return Boolean(task.assigneeId && task.assigneeId === ctx.userId);
  }
  return false;
}

export function evaluateTaskAssignmentRule(
  ctx: SessionContext,
  task: Pick<DbTask, "assigneeId">,
): RuleVerdict {
  if (canManageProjectTasks(ctx.role)) {
    return {
      id: "worker_assigned_task",
      ok: true,
      needsApproval: false,
      reason: "Managers may update any project task.",
    };
  }
  const assigned = Boolean(task.assigneeId && task.assigneeId === ctx.userId);
  return {
    id: "worker_assigned_task",
    ok: assigned,
    needsApproval: false,
    reason: assigned
      ? "Worker is updating their assigned task."
      : "Workers can only update tasks assigned to them.",
  };
}

export function rulesForOrg(organizationId: string) {
  const policy = getPolicy(organizationId);
  return {
    refundApprovalOverCents: policy.refundLimitCents,
    autoPaymentLimitCents: policy.autoPaymentLimitCents,
    discountCapPercent: policy.discountCapPercent,
    quietHoursAfter: 21,
    earliestScheduleHour: policy.earliestScheduleHour,
    jobDepositOverCents: 1_000_000,
    standingOrders: policy.standingOrders,
    killSwitch: policy.killSwitch,
  };
}

export function evaluateRules(input: RuleContext): RuleVerdict[] {
  const rules = rulesForOrg(input.organizationId);
  const hour = (input.at || new Date()).getHours();
  const verdicts: RuleVerdict[] = [];

  if (input.kind === "refund" || input.kind === "REFUND_CUSTOMER") {
    const over = (input.amountCents || 0) > rules.refundApprovalOverCents;
    verdicts.push({
      id: "refund_needs_approval",
      ok: true,
      needsApproval: over,
      reason: over
        ? `Refunds over $${(rules.refundApprovalOverCents / 100).toFixed(0)} need owner approval.`
        : "Refund is within the automatic refund limit.",
    });
  }

  if (input.channel === "sms" || input.kind === "send_sms" || input.kind === "SEND_MESSAGE") {
    const late = hour >= rules.quietHoursAfter;
    verdicts.push({
      id: "quiet_hours",
      ok: true,
      needsApproval: late,
      reason: late
        ? `Don't text customers after ${rules.quietHoursAfter}:00.`
        : "Within customer-text hours.",
    });
  }

  if (input.discountPercent != null) {
    const over = input.discountPercent > rules.discountCapPercent;
    verdicts.push({
      id: "discount_cap",
      ok: !over,
      needsApproval: over,
      reason: over
        ? `Never discount more than ${rules.discountCapPercent}% without approval.`
        : "Discount is within the cap.",
    });
  }

  if (input.jobAmountCents != null) {
    const needsDeposit = input.jobAmountCents > rules.jobDepositOverCents;
    verdicts.push({
      id: "job_deposit",
      ok: true,
      needsApproval: needsDeposit,
      reason: needsDeposit
        ? `Jobs over $${(rules.jobDepositOverCents / 100).toLocaleString()} require a deposit.`
        : "Job is under the deposit threshold.",
    });
  }

  if (input.amountCents != null && (input.kind === "vendor_payment" || input.kind === "large_transfer")) {
    const over = input.amountCents > rules.autoPaymentLimitCents;
    verdicts.push({
      id: "auto_payment_limit",
      ok: !over,
      needsApproval: over,
      reason: over
        ? `Payment exceeds the $${(rules.autoPaymentLimitCents / 100).toLocaleString()} automatic limit.`
        : "Payment is within the automatic limit.",
    });
  }

  return verdicts;
}

export function rulesBlock(verdicts: RuleVerdict[]) {
  return verdicts.find((row) => !row.ok) || null;
}

export function rulesNeedApproval(verdicts: RuleVerdict[]) {
  return verdicts.some((row) => row.needsApproval);
}
