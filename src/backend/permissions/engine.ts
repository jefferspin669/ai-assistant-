import { DEFAULT_ACTION_POLICIES, type ActionPolicy, type PolicyMode } from "@/backend/permissions/policies";

export type PermissionDecision = {
  action: string;
  permission: "AUTO_ALLOWED" | "OWNER_APPROVAL_REQUIRED";
  mode: PolicyMode;
  reason: string;
  limit: number | null;
  amount?: number;
};

function policyFor(action: string): ActionPolicy {
  const key = action.replace(/^issue_/, "");
  return (
    DEFAULT_ACTION_POLICIES.find((row) => row.action === key) || {
      action: key,
      limit: null,
      limitUnit: "none",
      mode: "approval",
    }
  );
}

/** Decide whether Atlas may execute or must ask the owner. */
export function authorizeAction(input: {
  action: string;
  amount?: number;
  discountPercent?: number;
}): PermissionDecision {
  const policy = policyFor(input.action);
  const amount = input.amount;
  const pct = input.discountPercent;

  if (policy.mode === "approval" && policy.limit == null) {
    return {
      action: input.action,
      permission: "OWNER_APPROVAL_REQUIRED",
      mode: "approval",
      reason: `${input.action} always needs the owner.`,
      limit: null,
      amount,
    };
  }

  if (policy.limitUnit === "usd" && amount != null && policy.limit != null && amount > policy.limit) {
    return {
      action: input.action,
      permission: "OWNER_APPROVAL_REQUIRED",
      mode: "approval",
      reason: `$${amount} is over the $${policy.limit} automatic limit.`,
      limit: policy.limit,
      amount,
    };
  }

  if (policy.limitUnit === "percent" && pct != null && policy.limit != null && pct > policy.limit) {
    return {
      action: input.action,
      permission: "OWNER_APPROVAL_REQUIRED",
      mode: "approval",
      reason: `${pct}% is over the ${policy.limit}% discount cap.`,
      limit: policy.limit,
      amount: pct,
    };
  }

  if (policy.mode === "approval") {
    return {
      action: input.action,
      permission: "OWNER_APPROVAL_REQUIRED",
      mode: "approval",
      reason: `${input.action} is approval-gated until the owner raises the limit.`,
      limit: policy.limit,
      amount,
    };
  }

  return {
    action: input.action,
    permission: "AUTO_ALLOWED",
    mode: "automatic",
    reason: "Within Atlas authority.",
    limit: policy.limit,
    amount,
  };
}
