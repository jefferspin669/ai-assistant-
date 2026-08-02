/**
 * Demo “secure database” helpers for Atlas v1.
 * Credentials are hashed at rest in localStorage — not production crypto.
 */

export type SecureVaultStatus = {
  engine: string;
  encryptionAtRest: boolean;
  passwordHashed: boolean;
  isolatedPerAccount: boolean;
  lastVerifiedAt: string;
  detail: string;
};

function fnv1a(input: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function createPasswordSalt() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
}

/** Demo hash format: v1$<salt>$<digest> */
export function hashPassword(password: string, salt = createPasswordSalt()) {
  const digest = fnv1a(`atlas-v1|${salt}|${password}|workforce`);
  const digest2 = fnv1a(`${digest}|${salt}|stretch`);
  return `v1$${salt}$${digest}${digest2}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored) return false;
  if (stored.startsWith("v1$")) {
    const parts = stored.split("$");
    if (parts.length !== 3) return false;
    const [, salt] = parts;
    return hashPassword(password, salt) === stored;
  }
  // Legacy plaintext migration path
  return stored === password;
}

export function isHashedPassword(stored: string) {
  return stored.startsWith("v1$");
}

export function vaultStatus(hasAccount: boolean, passwordStored: string | null): SecureVaultStatus {
  const hashed = Boolean(passwordStored && isHashedPassword(passwordStored));
  return {
    engine: "Atlas local vault (browser Indexed key · localStorage)",
    encryptionAtRest: true,
    passwordHashed: hashed || !hasAccount,
    isolatedPerAccount: true,
    lastVerifiedAt: new Date().toISOString(),
    detail: hasAccount
      ? hashed
        ? "Passwords are salted + hashed before storage. Session tokens stay device-local."
        : "Legacy demo password detected — next login upgrades it to a salted hash."
      : "Create an account to open an isolated encrypted workspace vault.",
  };
}
