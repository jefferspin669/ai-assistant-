import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import {
  hashPassword as legacyHashPassword,
  verifyPassword as legacyVerifyPassword,
} from "@/lib/secure-store";

/**
 * Server password hashing for `user_credentials`.
 * Format: v2$scrypt$<salt hex>$<digest hex>
 * Legacy v1$ FNV and plaintext are verified once, then upgraded on login.
 */

const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 } as const;

export function createPasswordSalt(bytes = 16) {
  return randomBytes(bytes).toString("hex");
}

export function hashPassword(password: string, salt = createPasswordSalt()) {
  const digest = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS).toString("hex");
  return `v2$scrypt$${salt}$${digest}`;
}

export function isModernPasswordHash(stored: string) {
  return stored.startsWith("v2$scrypt$");
}

export function needsPasswordRehash(stored: string) {
  return !isModernPasswordHash(stored);
}

function verifyScrypt(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "v2" || parts[1] !== "scrypt") return false;
  const salt = parts[2]!;
  const expected = parts[3]!;
  const actual = scryptSync(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTS).toString("hex");
  if (actual.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function verifyPassword(password: string, stored: string) {
  if (!stored) return false;
  if (isModernPasswordHash(stored)) return verifyScrypt(password, stored);
  // Legacy FNV / plaintext from secure-store — verify then migrate on login.
  return legacyVerifyPassword(password, stored);
}

/** Prefer modern scrypt; keep legacy hash helper for one-shot migrations in tests. */
export function hashPasswordLegacyCompat(password: string) {
  return legacyHashPassword(password);
}
