/**
 * Idempotency for outbound customer touches. A crashed worker must not send 50 texts.
 */

import { MAX_CUSTOMER_MESSAGES_PER_DAY, customerMessageFingerprint } from "@/lib/safety/guards";
import { cacheGet, cacheSet, redisConfigured } from "@/lib/redis";

const memory = new Map<string, number>();
const completed = new Set<string>();
const inFlight = new Set<string>();

export function resetIdempotencyForTests() {
  memory.clear();
  completed.clear();
  inFlight.clear();
}

export async function claimCustomerMessage(input: {
  organizationId: string;
  to: string;
  kind: string;
}): Promise<{ allowed: boolean; count: number; fingerprint: string }> {
  const fingerprint = customerMessageFingerprint(input);
  let count = memory.get(fingerprint) || 0;
  if (redisConfigured()) {
    const raw = await cacheGet(fingerprint);
    if (raw) count = Math.max(count, Number(raw) || 0);
  }
  if (count >= MAX_CUSTOMER_MESSAGES_PER_DAY) {
    return { allowed: false, count, fingerprint };
  }
  const next = count + 1;
  memory.set(fingerprint, next);
  if (redisConfigured()) {
    await cacheSet(fingerprint, String(next), 60 * 60 * 36);
  }
  return { allowed: true, count: next, fingerprint };
}

/** Start work. Completed jobs stay skipped; in-flight jobs are not retried in this process. A crash clears in-flight so BullMQ can retry. */
export function beginJob(jobId: string): "ok" | "duplicate" {
  if (!jobId) return "ok";
  if (completed.has(jobId) || inFlight.has(jobId)) return "duplicate";
  inFlight.add(jobId);
  return "ok";
}

export function finishJob(jobId: string, succeeded: boolean) {
  if (!jobId) return;
  inFlight.delete(jobId);
  if (succeeded) completed.add(jobId);
}

/** @deprecated use beginJob — kept so older tests keep compiling */
export function claimJobOnce(jobId: string): boolean {
  return beginJob(jobId) === "ok";
}
