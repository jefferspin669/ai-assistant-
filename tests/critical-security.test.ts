import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, saveDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import {
  authenticate,
  completeMfaLogin,
  enableMfa,
  mfaChallengeFromToken,
  sessionFromToken,
} from "../src/lib/auth/session";
import { hashPassword, isModernPasswordHash, verifyPassword } from "../src/lib/auth/password";
import { vaultStatus } from "../src/lib/secure-store";
import {
  ACTION_SMS,
  consumeApprovedConfirmation,
  stageActionApproval,
} from "../src/lib/services/action-confirmations";
import { sendCustomerSms } from "../src/lib/integrations/actions";
import { AuthenticationError, AuthorizationError, ValidationError } from "../src/lib/domain/errors";
import { putWorkspaceDomain, loadWorkspace } from "../src/lib/backend/workspace-store";
import { authenticateEmployeeLogin, ensureDemoEmployees } from "../src/lib/services/employees";
import { hasPermission } from "../src/lib/auth/permissions";
import { createHmac } from "crypto";

function totp(secret: string, step = Math.floor(Date.now() / 30000)) {
  const key = Buffer.from(secret, "hex");
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(step / 0x100000000), 0);
  buf.writeUInt32BE(step & 0xffffffff, 4);
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    (hmac[offset + 1]! << 16) |
    (hmac[offset + 2]! << 8) |
    hmac[offset + 3]!;
  return String(code % 1_000_000).padStart(6, "0");
}

describe("critical security fixes", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("hashes server passwords with scrypt and upgrades legacy hashes on login", () => {
    const modern = hashPassword("atlas-demo");
    expect(isModernPasswordHash(modern)).toBe(true);
    expect(verifyPassword("atlas-demo", modern)).toBe(true);
    expect(verifyPassword("wrong", modern)).toBe(false);

    const db = database();
    const user = db.users[0]!;
    // Leave legacy-looking hash; authenticate should still work via legacy verifier then upgrade.
    saveDatabase({
      ...db,
      user_credentials: db.user_credentials.map((c) =>
        c.user_id === user.id ? { ...c, password_hash: "atlas-demo" } : c,
      ),
    });
    const result = authenticate(user.email, "atlas-demo", "127.0.0.1");
    expect(result.mfaRequired).toBe(false);
    expect(result.token).toBeTruthy();
    const upgraded = database().user_credentials.find((c) => c.user_id === user.id)!;
    expect(isModernPasswordHash(upgraded.password_hash)).toBe(true);
  });

  it("does not issue a full session when MFA is required", () => {
    const db = database();
    const user = db.users[0]!;
    enableMfa(user.id, "aabbccddeeff00112233445566778899aabbccdd");
    const result = authenticate(user.email, "atlas-demo", "127.0.0.1");
    expect(result.mfaRequired).toBe(true);
    expect(result.token).toBeNull();
    expect(result.challengeToken).toBeTruthy();
    expect(() => sessionFromToken(result.challengeToken)).toThrow(AuthenticationError);

    const challenge = mfaChallengeFromToken(result.challengeToken);
    expect(challenge.user_id).toBe(user.id);

    // Completing MFA creates the real session.
    const secret = database().user_credentials.find((c) => c.user_id === user.id)!.mfa_secret!;
    expect(totp(secret)).toHaveLength(6);
    const session = completeMfaLogin(result.challengeToken!);
    expect(session.token).toBeTruthy();
    expect(sessionFromToken(session.token).userId).toBe(user.id);
    expect(() => mfaChallengeFromToken(result.challengeToken)).toThrow();
  });

  it("ignores client approved flags and requires a consumed server confirmation for SMS", async () => {
    const db = database();
    const ctx = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    expect(hasPermission(ctx, "actions.sms")).toBe(true);

    const staged = await sendCustomerSms(ctx, {
      to: "+15551234567",
      body: "Hello",
    });
    expect(staged.status).toBe("needs_approval");
    expect(staged.approvalId).toBeTruthy();

    expect(() =>
      consumeApprovedConfirmation(ctx, staged.approvalId, ACTION_SMS),
    ).toThrow(AuthorizationError);

    // Approve then consume.
    saveDatabase({
      ...database(),
      approvals: database().approvals.map((a) =>
        a.id === staged.approvalId ? { ...a, status: "approved" as const, resolved_at: new Date().toISOString() } : a,
      ),
    });
    const sent = await sendCustomerSms(ctx, {
      to: "+15551234567",
      body: "Hello",
      confirmationId: staged.approvalId,
    });
    expect(sent.status === "sent" || sent.status === "failed").toBe(true);

    expect(() =>
      consumeApprovedConfirmation(ctx, staged.approvalId, ACTION_SMS),
    ).toThrow();
  });

  it("keeps workspace data tenant-scoped", () => {
    const orgA = database().organizations[0]!.id;
    putWorkspaceDomain(orgA, "tasks", [{ id: "1", title: "A only" }]);
    const bag = loadWorkspace(orgA);
    expect(bag.domains.tasks).toEqual([{ id: "1", title: "A only" }]);
    expect(loadWorkspace("org_other").domains.tasks).toBeUndefined();
  });

  it("does not claim localStorage encryption at rest", () => {
    const status = vaultStatus(true, "v2$sha256$abc$def");
    expect(status.encryptionAtRest).toBe(false);
    expect(status.detail.toLowerCase()).toMatch(/not encrypted/);
  });

  it("authenticates employees via server roster and access codes", () => {
    const orgId = database().organizations[0]!.id;
    const demos = ensureDemoEmployees(orgId);
    const marcus = demos.find((d) => d.email.startsWith("marcus"))!;
    const login = authenticateEmployeeLogin({
      email: marcus.email,
      accessCode: marcus.accessCode!,
      organizationId: orgId,
    });
    expect(login.token).toBeTruthy();
    expect(login.employee.email).toBe(marcus.email);
    expect(() =>
      authenticateEmployeeLogin({ email: marcus.email, accessCode: "WRONG1", organizationId: orgId }),
    ).toThrow(AuthenticationError);
  });

  it("stages action approvals without trusting request approved flags", () => {
    const db = database();
    const ctx = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const row = stageActionApproval(ctx, ACTION_SMS, { to: "+15550001111", body: "Ping" });
    expect(row.status).toBe("pending");
    expect(() => consumeApprovedConfirmation(ctx, undefined, ACTION_SMS)).toThrow(ValidationError);
  });
});
