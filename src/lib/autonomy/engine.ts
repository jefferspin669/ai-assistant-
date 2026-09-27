import { bandFor, formatUsd, kindLabel, minLevelForBand } from "@/lib/autonomy/catalog";
import { kindAllowedByPermissions } from "@/lib/autonomy/permissions";
import type {
  AutonomyDecision,
  AutonomyPolicy,
  WorkIntent,
} from "@/lib/autonomy/types";

function moneyLimit(intent: WorkIntent, policy: AutonomyPolicy): number | undefined {
  if (intent.kind === "refund") return policy.refundLimitCents;
  if (intent.kind === "marketing_spend") return policy.marketingBudgetCents;
  if (
    intent.kind === "vendor_payment" ||
    intent.kind === "large_transfer" ||
    intent.kind === "take_loan"
  ) {
    return policy.autoPaymentLimitCents;
  }
  if (intent.amountCents != null && intent.kind === "apply_discount") {
    return undefined;
  }
  if (intent.amountCents != null) return policy.autoPaymentLimitCents;
  return undefined;
}

function ownerCard(intent: WorkIntent, policy: AutonomyPolicy, reason?: string): string {
  const amount = intent.amountCents;
  const limit = moneyLimit(intent, policy);
  const lines = ["Atlas needs you"];
  if (amount != null) {
    lines.push(`${intent.title}: ${formatUsd(amount)}`);
  } else {
    lines.push(intent.title);
  }
  if (limit != null) {
    const label =
      intent.kind === "refund"
        ? "Your automatic-refund limit"
        : intent.kind === "marketing_spend"
          ? "Your marketing budget"
          : "Your automatic-payment limit";
    lines.push(`${label}: ${formatUsd(limit)}`);
  } else if (reason) {
    lines.push(reason);
  }
  return lines.join("\n");
}

export function decideWork(intent: WorkIntent, policy: AutonomyPolicy): AutonomyDecision {
  const band = bandFor(intent.kind);
  const limit = moneyLimit(intent, policy);
  const base = {
    kind: intent.kind,
    band,
    title: intent.title,
    summary: intent.summary,
    amountCents: intent.amountCents,
    limitCents: limit,
  };

  if (policy.killSwitch) {
    return {
      ...base,
      verdict: "ask_owner",
      reason: "Kill switch is on — Atlas will not act until you turn autonomy back on.",
      ownerPrompt: ownerCard(intent, policy, "Kill switch is on."),
    };
  }

  if (band === "restricted") {
    const overLimit =
      intent.amountCents != null && limit != null && intent.amountCents > limit;
    const reason = overLimit
      ? `${kindLabel(intent.kind)} ${formatUsd(intent.amountCents!)} is over your ${formatUsd(limit!)} automatic limit.`
      : `${kindLabel(intent.kind)} always needs you. Atlas does not get unrestricted authority here.`;
    return {
      ...base,
      verdict: "ask_owner",
      reason,
      ownerPrompt: ownerCard(intent, policy, reason),
    };
  }

  if (policy.controlMode === "manual" || policy.level === 1) {
    return {
      ...base,
      verdict: "ask_owner",
      reason: "Manual mode — Atlas recommends, and waits for your approval.",
      ownerPrompt: ownerCard(intent, policy, "Approve for Atlas to continue."),
    };
  }

  if (!kindAllowedByPermissions(intent.kind, policy)) {
    const reason = `${kindLabel(intent.kind)} is outside the categories you enabled for automatic work.`;
    return {
      ...base,
      verdict: "ask_owner",
      reason,
      ownerPrompt: ownerCard(intent, policy, reason),
    };
  }

  if (intent.kind === "apply_discount") {
    const pct = intent.discountPercent ?? 0;
    if (pct > policy.discountCapPercent) {
      const reason = `Discount ${pct}% is over your ${policy.discountCapPercent}% cap.`;
      return {
        ...base,
        verdict: "ask_owner",
        reason,
        ownerPrompt: ownerCard(intent, policy, reason),
      };
    }
  }

  if (intent.amountCents != null && limit != null && intent.amountCents > limit) {
    const reason = `${formatUsd(intent.amountCents)} exceeds your ${formatUsd(limit)} automatic limit.`;
    return {
      ...base,
      verdict: "ask_owner",
      reason,
      ownerPrompt: ownerCard(intent, policy, reason),
    };
  }

  const needed = minLevelForBand(band);
  if (policy.level < needed) {
    const reason =
      band === "operational"
        ? "Operational decisions need Level 3 — Business Manager — or your approval."
        : "This action is outside the current autonomy level.";
    return {
      ...base,
      verdict: "ask_owner",
      reason,
      ownerPrompt: ownerCard(intent, policy, reason),
    };
  }

  return {
    ...base,
    verdict: "execute",
    reason:
      policy.level >= 4
        ? "Within authority — Atlas will run this and only ping you for exceptions."
        : "Within the rules you set — Atlas will handle it.",
    ownerPrompt: ownerCard(intent, policy, "Already within Atlas authority."),
  };
}

export function isAwayPhrase(message: string): boolean {
  const q = message.toLowerCase();
  return (
    q.includes("going home") ||
    q.includes("going on vacation") ||
    q.includes("run the company") ||
    q.includes("handle tonight") ||
    q.includes("handle anything routine")
  );
}

export function levelFromAwayPhrase(message: string): AutonomyPolicy["level"] {
  const q = message.toLowerCase();
  if (q.includes("vacation") || q.includes("run the company")) return 4;
  if (q.includes("discount") || q.includes("refund") || q.includes("fill cancel")) return 3;
  return 2;
}
