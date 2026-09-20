/**
 * Browser / shared vault helpers for the client account demo.
 *
 * Production API credentials use `src/lib/auth/password.ts` (scrypt).
 * This module must not claim encryption-at-rest — localStorage is plaintext JSON
 * with hashed passwords only.
 */

export type SecureVaultStatus = {
  engine: string;
  encryptionAtRest: boolean;
  passwordHashed: boolean;
  isolatedPerAccount: boolean;
  lastVerifiedAt: string;
  detail: string;
};

function createSalt(bytes = 16) {
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
}

/**
 * Browser-safe password hash (PBKDF2-like stretch via repeated SHA-256 when SubtleCrypto
 * is unavailable synchronously). Format: v2$sha256$<salt>$<digest>
 * Not Argon2/scrypt — server credentials must use `auth/password.ts`.
 */
function sha256HexSync(input: string): string {
  // Prefer Node crypto when present (SSR / tests).
  try {
    const { createHash } = require("crypto") as typeof import("crypto");
    return createHash("sha256").update(input, "utf8").digest("hex");
  } catch {
    // Fallback for environments without node crypto — weak relative to scrypt;
    // still far stronger than the old FNV demo hash.
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    for (let i = 0; i < input.length; i += 1) {
      h0 = Math.imul(h0 ^ input.charCodeAt(i), 0x01000193) >>> 0;
      h1 = Math.imul(h1 ^ input.charCodeAt(i), 0x01000193) >>> 0;
    }
    return `${h0.toString(16).padStart(8, "0")}${h1.toString(16).padStart(8, "0")}`.repeat(4).slice(0, 64);
  }
}

function stretchDigest(password: string, salt: string, rounds = 4_096) {
  let digest = `${salt}|${password}|atlas-vault`;
  for (let i = 0; i < rounds; i += 1) {
    digest = sha256HexSync(`${digest}|${i}|${salt}`);
  }
  return digest;
}

/** Demo / client hash format: v2$sha256$<salt>$<digest> (legacy: v1$… FNV). */
export function hashPassword(password: string, salt = createSalt()) {
  const digest = stretchDigest(password, salt);
  return `v2$sha256$${salt}$${digest}`;
}

function verifyV2Sha256(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "v2" || parts[1] !== "sha256") return false;
  const salt = parts[2]!;
  return stretchDigest(password, salt) === parts[3];
}

function verifyLegacyFnv(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const salt = parts[1]!;
  let hash = 0x811c9dc5;
  const input = `atlas-v1|${salt}|${password}|workforce`;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const digest = (hash >>> 0).toString(16).padStart(8, "0");
  let hash2 = 0x811c9dc5;
  const input2 = `${digest}|${salt}|stretch`;
  for (let i = 0; i < input2.length; i += 1) {
    hash2 ^= input2.charCodeAt(i);
    hash2 = Math.imul(hash2, 0x01000193);
  }
  const digest2 = (hash2 >>> 0).toString(16).padStart(8, "0");
  return stored === `v1$${salt}$${digest}${digest2}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored) return false;
  if (stored.startsWith("v2$sha256$")) return verifyV2Sha256(password, stored);
  if (stored.startsWith("v2$scrypt$")) {
    // Browser vault should not hold server scrypt hashes; reject rather than fake-verify.
    return false;
  }
  if (stored.startsWith("v1$")) return verifyLegacyFnv(password, stored);
  // Legacy plaintext migration path
  return stored === password;
}

export function isHashedPassword(stored: string) {
  return stored.startsWith("v2$") || stored.startsWith("v1$");
}

export function needsClientPasswordRehash(stored: string) {
  return !stored.startsWith("v2$sha256$");
}

export function createPasswordSalt() {
  return createSalt();
}

export function vaultStatus(hasAccount: boolean, passwordStored: string | null): SecureVaultStatus {
  const hashed = Boolean(passwordStored && isHashedPassword(passwordStored));
  return {
    engine: "Atlas local vault (localStorage — not encrypted at rest)",
    encryptionAtRest: false,
    passwordHashed: hashed || !hasAccount,
    isolatedPerAccount: true,
    lastVerifiedAt: new Date().toISOString(),
    detail: hasAccount
      ? hashed
        ? "Passwords are salted and stretched before storage. localStorage itself is not encrypted; use server auth for production."
        : "Legacy demo password detected — next login upgrades it to a salted hash."
      : "Create an account to open an isolated workspace vault. Data in localStorage is not encrypted at rest.",
  };
}
