import { createHmac, timingSafeEqual } from "crypto";
import { AuthorizationError, ConflictError, ValidationError } from "@/lib/domain/errors";
import { isProduction } from "@/lib/ops/environment";
import { getAppUrl } from "@/lib/integrations/config";
import { loadDatabase, nowIso, saveDatabase } from "@/lib/db/store";

/**
 * Validate Twilio webhook authenticity (X-Twilio-Signature) and dedupe by CallSid/MessageSid.
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 */

export function twilioAuthToken() {
  return process.env.TWILIO_AUTH_TOKEN?.trim() || "";
}

export function twilioWebhookUrl(pathname: string) {
  const configured = process.env.TWILIO_WEBHOOK_BASE_URL?.trim() || getAppUrl();
  const base = configured.replace(/\/$/, "");
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

export function validateTwilioSignature(input: {
  signature: string | null;
  url: string;
  params: Record<string, string>;
  authToken?: string;
}) {
  const authToken = input.authToken ?? twilioAuthToken();
  if (!authToken) {
    if (isProduction()) {
      throw new AuthorizationError("Twilio auth token is not configured.");
    }
    if (process.env.TWILIO_SKIP_SIGNATURE === "1") return true;
    throw new AuthorizationError(
      "Twilio signature validation required (set TWILIO_AUTH_TOKEN or TWILIO_SKIP_SIGNATURE=1 for local).",
    );
  }
  if (!input.signature) throw new AuthorizationError("Missing X-Twilio-Signature.");

  const sortedKeys = Object.keys(input.params).sort();
  let data = input.url;
  for (const key of sortedKeys) {
    data += key + (input.params[key] ?? "");
  }
  const expected = createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(input.signature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AuthorizationError("Invalid Twilio signature.");
  }
  return true;
}

export async function assertTwilioWebhook(req: Request, pathname: string, rawBody: string) {
  const params = Object.fromEntries(new URLSearchParams(rawBody).entries()) as Record<string, string>;
  const url = twilioWebhookUrl(pathname);
  validateTwilioSignature({
    signature: req.headers.get("x-twilio-signature"),
    url,
    params,
  });
  return params;
}

/** Replay protection using CallSid / MessageSid / SmsSid. */
export function claimTwilioIdempotency(organizationId: string, sid: string | undefined) {
  if (!sid?.trim()) throw new ValidationError("Twilio Sid required for idempotency.");
  const db = loadDatabase();
  const id = `twilio:${sid.trim()}`;
  if (db.webhook_receipts.some((r) => r.id === id)) {
    throw new ConflictError("Twilio event already processed.");
  }
  saveDatabase({
    ...db,
    webhook_receipts: [
      { id, organization_id: organizationId, received_at: nowIso() },
      ...db.webhook_receipts,
    ].slice(0, 2000),
  });
  return id;
}

export function resolveTwilioOrganizationId(toNumber?: string) {
  const mapped = process.env.ATLAS_TWILIO_ORGANIZATION_ID?.trim();
  if (mapped) return mapped;
  const phone = (toNumber || process.env.TWILIO_PHONE_NUMBER || "").replace(/\D/g, "");
  const raw = process.env.ATLAS_TWILIO_ORG_MAP?.trim();
  if (raw && phone) {
    try {
      const map = JSON.parse(raw) as Record<string, string>;
      const hit = map[phone] || map[`+${phone}`];
      if (hit) return hit;
    } catch {
      /* ignore */
    }
  }
  if (isProduction()) {
    throw new ValidationError(
      "Set ATLAS_TWILIO_ORGANIZATION_ID (or ATLAS_TWILIO_ORG_MAP) — default organization fallbacks are disabled in production.",
    );
  }
  const org = loadDatabase().organizations[0]?.id;
  if (!org) throw new ValidationError("No organization seeded for Twilio webhook.");
  return org;
}
