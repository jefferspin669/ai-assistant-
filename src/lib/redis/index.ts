/**
 * Redis for short-lived state, locks, cache, and BullMQ coordination.
 * No-ops when REDIS_URL is unset so demos still run from JSON.
 */

import IORedis from "ioredis";

let connection: IORedis | null = null;

export function redisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

export function getRedis(): IORedis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!connection) {
    connection = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
  }
  return connection;
}

export async function pingRedis(): Promise<{ ok: boolean; error?: string }> {
  const conn = getRedis();
  if (!conn) return { ok: false, error: "REDIS_URL unset" };
  try {
    const pong = await conn.ping();
    return { ok: pong === "PONG" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "redis ping failed" };
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const conn = getRedis();
  if (!conn) return null;
  return conn.get(key);
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  const conn = getRedis();
  if (!conn) return;
  await conn.set(key, value, "EX", ttlSeconds);
}

/** Distributed lock. Returns false if the lock is already held. */
export async function withLock<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<T | null> {
  const conn = getRedis();
  if (!conn) return fn();
  const lockKey = `lock:${key}`;
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const acquired = await conn.set(lockKey, token, "PX", ttlMs, "NX");
  if (acquired !== "OK") return null;
  try {
    return await fn();
  } finally {
    const current = await conn.get(lockKey);
    if (current === token) await conn.del(lockKey);
  }
}
