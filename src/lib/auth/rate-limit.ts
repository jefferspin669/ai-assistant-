import { RateLimitError } from "@/lib/domain/errors";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function resetRateLimitForTests() {
  buckets.clear();
}

export function rateLimit(key: string, max = 20, windowMs = 15 * 60 * 1000) {
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

export function clientKey(req: Request) {
  return req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "local";
}
