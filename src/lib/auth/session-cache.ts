/**
 * Redis-backed Atlas sessions. Falls back to the in-process database.sessions table.
 */

import { cacheGet, cacheSet, redisConfigured } from "@/lib/redis";

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type CachedSession = {
  sessionId: string;
  token: string;
  userId: string;
  organizationId: string;
  role: string;
  expiresAt: string;
};

function key(token: string) {
  return `atlas:session:${token}`;
}

export async function cacheSession(session: CachedSession) {
  if (!redisConfigured()) return;
  await cacheSet(key(session.token), JSON.stringify(session), SESSION_TTL_SECONDS);
}

export async function readCachedSession(token: string): Promise<CachedSession | null> {
  if (!redisConfigured()) return null;
  const raw = await cacheGet(key(token));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedSession;
    if (!parsed?.userId || !parsed.organizationId) return null;
    if (parsed.expiresAt && +new Date(parsed.expiresAt) < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
