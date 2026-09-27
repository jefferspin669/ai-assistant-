import { cacheGet, cacheSet, redisConfigured } from "@/lib/redis";

const KEY = "atlas:worker:heartbeat";

export async function touchWorkerHeartbeat() {
  const stamp = new Date().toISOString();
  if (redisConfigured()) await cacheSet(KEY, stamp, 120);
  (globalThis as typeof globalThis & { __atlasWorkerHeartbeat?: string }).__atlasWorkerHeartbeat = stamp;
  return stamp;
}

export async function readWorkerHeartbeat(): Promise<{ ok: boolean; at: string | null; stale: boolean }> {
  let at: string | null = null;
  if (redisConfigured()) at = await cacheGet(KEY);
  if (!at) {
    at = (globalThis as typeof globalThis & { __atlasWorkerHeartbeat?: string }).__atlasWorkerHeartbeat || null;
  }
  if (!at) return { ok: false, at: null, stale: true };
  const age = Date.now() - new Date(at).getTime();
  const stale = age > 90_000;
  return { ok: !stale, at, stale };
}
