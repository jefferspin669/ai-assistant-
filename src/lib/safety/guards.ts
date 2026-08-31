/**
 * Atlas safety rails. These are the checks that must pass before a real-world action.
 */

import { AuthorizationError } from "@/lib/domain/errors";
import type { SessionContext } from "@/lib/domain/types";
import { bandFor } from "@/lib/autonomy/catalog";
import type { AutonomyKind, WorkIntent } from "@/lib/autonomy/types";

export const MAX_PAYMENT_ATTEMPTS = 3;
export const MAX_CUSTOMER_MESSAGES_PER_DAY = 3;

const ATLAS_SESSION_IDS = new Set(["worker", "queue", "service"]);

export function isAtlasActor(ctx: Pick<SessionContext, "userId" | "sessionId">): boolean {
  return ctx.userId === "atlas" || ATLAS_SESSION_IDS.has(ctx.sessionId);
}

/** Atlas never signs its own restricted approvals. A human owner/admin must. */
export function assertHumanApproval(ctx: SessionContext) {
  if (isAtlasActor(ctx)) {
    throw new AuthorizationError("Atlas cannot approve its own restricted action.");
  }
}

export function isRestrictedKind(kind: string): boolean {
  try {
    return bandFor(kind as AutonomyKind) === "restricted";
  } catch {
    return false;
  }
}

export function paymentAttemptOutcome(attemptsMade: number): "retry" | "dead_letter" {
  if (attemptsMade >= MAX_PAYMENT_ATTEMPTS) return "dead_letter";
  return "retry";
}

export function isPaymentKind(kind: string): boolean {
  return (
    kind === "vendor_payment" ||
    kind === "refund" ||
    kind === "large_transfer" ||
    kind === "marketing_spend" ||
    kind === "autonomy:vendor_payment" ||
    kind === "autonomy:refund" ||
    kind === "autonomy:large_transfer" ||
    kind.includes("payment")
  );
}

export function customerMessageFingerprint(input: {
  organizationId: string;
  to: string;
  kind: string;
  day?: string;
}) {
  const day = input.day || new Date().toISOString().slice(0, 10);
  return `msg:${input.organizationId}:${input.kind}:${input.to}:${day}`;
}

export function spendExceedsLimit(intent: Pick<WorkIntent, "amountCents">, limitCents: number | undefined) {
  if (intent.amountCents == null || limitCents == null) return false;
  return intent.amountCents > limitCents;
}
