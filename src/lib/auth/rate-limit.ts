import { RateLimitError } from "@/lib/domain/errors";
import { getRedis } from "@/lib/redis";
import { isProduction } from "@/lib/ops/environment";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function resetRateLimitForTests() {
  buckets.clear();
}

function memoryRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > max) {
    throw new RateLimitError();
  }
}

/**
 * Rate limit. Uses Redis when REDIS_URL is set (shared across instances);
 * falls back to in-process buckets for local demos.
 */
export async function rateLimitAsync(key: string, max = 20, windowMs = 15 * 60 * 1000) {
  const redis = getRedis();
  if (!redis) {
    memoryRateLimit(key, max, windowMs);
    return;
  }
  const redisKey = `rl:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.pexpire(redisKey, windowMs);
  }
  if (count > max) {
    throw new RateLimitError();
  }
}

/** In-process limiter (tests + sync call sites). Prefer rateLimitAsync in routes. */
export function rateLimit(key: string, max = 20, windowMs = 15 * 60 * 1000) {
  memoryRateLimit(key, max, windowMs);
}

/**
 * Client identity for rate limits.
 * Only trusts x-forwarded-for when TRUST_PROXY=1 (or known production edge).
 */
export function clientKey(req: Request) {
  const trustProxy =
    process.env.TRUST_PROXY === "1" ||
    process.env.TRUST_PROXY === "true" ||
    (isProduction() && Boolean(process.env.VERCEL || process.env.FLY_APP_NAME));

  if (trustProxy) {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first;
    }
    const realIp = req.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
  }

  return req.headers.get("cf-connecting-ip")?.trim() || "local";
}
