/**
 * Idempotency for outbound customer touches. A crashed worker must not send 50 texts.
 */

import { MAX_CUSTOMER_MESSAGES_PER_DAY, customerMessageFingerprint } from "@/lib/safety/guards";
import { getRedis, redisConfigured } from "@/lib/redis";

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
  if (redisConfigured()) {
    const value = Number(await getRedis()!.eval(`
      local count = tonumber(redis.call('GET', KEYS[1]) or '0')
      if count >= tonumber(ARGV[1]) then return -count end
      count = redis.call('INCR', KEYS[1])
      if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
      return count`, 1, fingerprint, MAX_CUSTOMER_MESSAGES_PER_DAY, 36 * 3600));
    return { allowed: value > 0, count: Math.abs(value), fingerprint };
  }
  const count = memory.get(fingerprint) || 0;
  if (count >= MAX_CUSTOMER_MESSAGES_PER_DAY) {
    return { allowed: false, count, fingerprint };
  }
  const next = count + 1;
  memory.set(fingerprint, next);
  return { allowed: true, count: next, fingerprint };
}

/** Atomic send reservation; uncertain provider outcomes require owner review. */
export async function claimExactOnce(fingerprint: string): Promise<{ allowed: boolean }> {
  if (completed.has(fingerprint)) return { allowed: false };
  if (redisConfigured()) {
    const claimed = await getRedis()!.set(`once:${fingerprint}`, "reserved", "EX", 60 * 60 * 24 * 30, "NX");
    if (claimed !== "OK") {
      completed.add(fingerprint);
      return { allowed: false };
    }
  }
  completed.add(fingerprint);
  return { allowed: true };
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
