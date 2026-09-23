import { createHmac } from "crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, saveDatabase, flushDatabaseWrites, loadDatabase } from "../src/lib/db/store";
import { validateTwilioSignature, resolveTwilioOrganizationId } from "../src/lib/integrations/twilio-security";
import { requireOrganizationId } from "../src/lib/auth/tenant";
import { AuthorizationError, ValidationError } from "../src/lib/domain/errors";
import { clientKey } from "../src/lib/auth/rate-limit";
import { connectionBadge } from "../src/lib/integrations/config";
import { cookieHeader } from "../src/lib/auth/session";

describe("backend hardening", () => {
  beforeEach(() => {
    resetDatabase();
    delete process.env.ATLAS_ENV;
    delete process.env.ATLAS_TWILIO_ORGANIZATION_ID;
    delete process.env.TRUST_PROXY;
    delete process.env.COOKIE_SECURE;
  });

  it("validates Twilio signatures with the exact webhook URL", () => {
    const authToken = "testtoken123";
    const url = "https://example.com/api/webhooks/twilio/sms";
    const params = { From: "+15551234567", Body: "hi", MessageSid: "SM123" };
    const sorted = Object.keys(params).sort();
    let data = url;
    for (const key of sorted) data += key + params[key as keyof typeof params];
    const signature = createHmac("sha1", authToken).update(Buffer.from(data, "utf8")).digest("base64");
    expect(
      validateTwilioSignature({ signature, url, params, authToken }),
    ).toBe(true);
    expect(() =>
      validateTwilioSignature({ signature: "bad", url, params, authToken }),
    ).toThrow(AuthorizationError);
  });

  it("requires Twilio org mapping in production", () => {
    process.env.ATLAS_ENV = "production";
    expect(() => resolveTwilioOrganizationId("+1555")).toThrow(ValidationError);
    process.env.ATLAS_TWILIO_ORGANIZATION_ID = "org_live";
    expect(resolveTwilioOrganizationId("+1555")).toBe("org_live");
  });

  it("forbids default org fallbacks in production", () => {
    process.env.ATLAS_ENV = "production";
    expect(() => requireOrganizationId(undefined)).toThrow(ValidationError);
    expect(() => requireOrganizationId("org_demo")).toThrow(ValidationError);
    expect(requireOrganizationId("org_real")).toBe("org_real");
  });

  it("does not trust x-forwarded-for without TRUST_PROXY", () => {
    const req = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(clientKey(req)).toBe("local");
    process.env.TRUST_PROXY = "1";
    expect(clientKey(req)).toBe("1.2.3.4");
  });

  it("sets Secure on session cookies in production", () => {
    process.env.ATLAS_ENV = "production";
    expect(cookieHeader("abc")).toMatch(/Secure/);
  });

  it("exposes honest connection badges", () => {
    expect(connectionBadge("live").label).toBe("Live");
    expect(connectionBadge("partial").label).toBe("Partially connected");
    expect(connectionBadge("simulation").label).toBe("Simulation");
    expect(connectionBadge("unavailable").label).toBe("Unavailable");
  });

  it("flushes database writes without throwing when postgres is unset", async () => {
    const db = loadDatabase();
    saveDatabase({
      ...db,
      audit_logs: [
        {
          id: "audit_test",
          organization_id: db.organizations[0]!.id,
          actor_user_id: db.users[0]!.id,
          actor_label: "test",
          action: "flush.check",
          entity_type: "test",
          entity_id: null,
          created_at: new Date().toISOString(),
        },
        ...db.audit_logs,
      ],
    });
    await expect(flushDatabaseWrites()).resolves.toBeUndefined();
  });
});
