/**
 * Envelope encryption for integration tokens at rest.
 * Production: set ATLAS_SECRETS_KEY (32+ chars). Rotation: reconnect OAuth after changing the key.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function keyMaterial(): Buffer | null {
  const raw = (process.env.ATLAS_SECRETS_KEY || process.env.ATLAS_APP_PASSWORD || "").trim();
  if (raw.length < 16) return null;
  return createHash("sha256").update(`atlas-secrets|${raw}`).digest();
}

export function secretsKeyConfigured(): boolean {
  return keyMaterial() !== null;
}

export function encryptSecret(plain: string): string {
  if (!plain) return plain;
  if (plain.startsWith(PREFIX)) return plain;
  const key = keyMaterial();
  if (!key) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(value: string): string {
  if (!value || !value.startsWith(PREFIX)) return value;
  const key = keyMaterial();
  if (!key) throw new Error("ATLAS_SECRETS_KEY required to decrypt stored credentials.");
  const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Corrupt encrypted secret.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]).toString("utf8");
}

export function rotateEncryptedValue(previous: string): string {
  return encryptSecret(decryptSecret(previous));
}
