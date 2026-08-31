import { beforeEach, describe, expect, it } from "vitest";
import { decideWork } from "../src/lib/autonomy/engine";
import { defaultPolicy } from "../src/lib/autonomy/defaults";
import { submitWork } from "../src/lib/autonomy/submit";
import { patchPolicy } from "../src/lib/autonomy/policy";
import { resolveApproval } from "../src/lib/domain/actions";
import { AuthorizationError } from "../src/lib/domain/errors";
import { resetDatabase, saveDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { listCustomers, listOrgTransactions, createCustomer } from "../src/lib/services/workspace";
import { listAudit } from "../src/lib/services/audit";
import { handleQueuedWork } from "../src/lib/queue/handlers";
import { beginJob, claimCustomerMessage, finishJob, resetIdempotencyForTests } from "../src/lib/safety/idempotency";
import { MAX_CUSTOMER_MESSAGES_PER_DAY, MAX_PAYMENT_ATTEMPTS, paymentAttemptOutcome } from "../src/lib/safety/guards";
import { recordDeadLetter, listDeadLetters, resetDeadLettersForTests } from "../src/lib/queue/dead-letter";
import { exportOrganization, deleteOrganizationData, supportSnapshot } from "../src/lib/privacy/account";
import { assertNoClientSecrets, redactSecrets } from "../src/lib/secrets/redact";
import { encryptSecret, decryptSecret } from "../src/lib/secrets/vault";
import { maxAutonomyLevelForPlan, subscriptionForOrg } from "../src/lib/billing/entitlements";
import { consumePasswordReset, createPasswordReset } from "../src/lib/auth/session";
import { atlasApi } from "../src/lib/api/atlas-api";
import { createCheckoutSession, handleStripeWebhook } from "../src/lib/integrations/stripe";
import { resetStripeAccountsForTests, stripeAccountForOrg } from "../src/lib/billing/stripe-accounts";
import { backupJsonDatabase, restoreJsonDatabase } from "../src/lib/ops/backup";
import { rateLimit, resetRateLimitForTests } from "../src/lib/auth/rate-limit";
import { RateLimitError } from "../src/lib/domain/errors";
import { touchWorkerHeartbeat, readWorkerHeartbeat } from "../src/lib/queue/heartbeat";
import { reconnectIntegration } from "../src/lib/services/integrations";
import { atlasRuntimeEnv } from "../src/lib/ops/environment";
import type { AutonomyPolicy, WorkIntent } from "../src/lib/autonomy/types";
import { AUTONOMOUS_AUTO_PERMISSIONS, levelToControlMode } from "../src/lib/autonomy/permissions";

function policy(level: AutonomyPolicy["level"], extra: Partial<AutonomyPolicy> = {}): AutonomyPolicy {
  const base = {
    ...defaultPolicy("org_test"),
    level,
    controlMode: levelToControlMode(level),
    autoPermissions:
      level >= 3 ? { ...AUTONOMOUS_AUTO_PERMISSIONS } : defaultPolicy("org_test").autoPermissions,
    ...extra,
  };
  return base;
}

describe("Atlas autonomy safety", () => {
  beforeEach(() => {
    resetDatabase();
    resetIdempotencyForTests();
    resetDeadLettersForTests();
    resetStripeAccountsForTests();
    resetRateLimitForTests();
  });

  function ownerCtx() {
    const db = database();
    return testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
  }

  it("cannot spend above the owner's automatic payment limit", () => {
    const decision = decideWork(
      {
        kind: "vendor_payment",
        title: "Vendor payment",
        summary: "Compressor",
        amountCents: 1_842_000,
      },
      policy(4, { autoPaymentLimitCents: 500_000 }),
    );
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.reason).toMatch(/exceeds/i);
  });

  it("cannot transfer money without approval when over the limit", () => {
    const decision = decideWork(
      {
        kind: "large_transfer",
        title: "Wire transfer",
        summary: "Move funds",
        amountCents: 2_000_000,
      },
      policy(4),
    );
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.band).toBe("restricted");
  });

  it("cannot fire an employee automatically, even on Autopilot", () => {
    const decision = decideWork(
      { kind: "fire_employee", title: "Let Alex go", summary: "Role elimination" },
      policy(4),
    );
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.band).toBe("restricted");
  });

  it("cannot approve its own restricted action", () => {
    const ctx = ownerCtx();
    patchPolicy(ctx.organizationId, { level: 4 });
    const submitted = submitWork(ctx, {
      kind: "fire_employee",
      title: "Let Alex go",
      summary: "Role elimination",
    });
    expect(submitted.approvalId).toBeTruthy();
    const worker = testSession("atlas", ctx.organizationId, "owner");
    worker.sessionId = "worker";
    expect(() => resolveApproval(worker, submitted.approvalId!, "approved")).toThrow(AuthorizationError);
  });

  it("records who caused every important autonomy action", () => {
    const ctx = ownerCtx();
    submitWork(ctx, {
      kind: "send_reminder",
      title: "Reminder",
      summary: "Tomorrow 9am",
    });
    const logs = listAudit(ctx.organizationId);
    expect(logs.some((row) => row.action.includes("autonomy:") && row.organization_id === ctx.organizationId)).toBe(
      true,
    );
  });

  it("cannot keep retrying a failed payment forever", () => {
    expect(paymentAttemptOutcome(1)).toBe("retry");
    expect(paymentAttemptOutcome(MAX_PAYMENT_ATTEMPTS)).toBe("dead_letter");
    expect(paymentAttemptOutcome(MAX_PAYMENT_ATTEMPTS + 5)).toBe("dead_letter");
  });

  it("dead-letters exhausted payment jobs", async () => {
    const ctx = ownerCtx();
    const result = await handleQueuedWork("vendor_payment", {
      jobId: "job_pay_exhausted",
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      payload: {},
      attemptsMade: MAX_PAYMENT_ATTEMPTS,
    });
    expect(result.ok).toBe(false);
    if ("skipped" in result) expect(result.skipped).toBe("dead_letter");
    expect(listDeadLetters(ctx.organizationId).some((row) => row.jobId === "job_pay_exhausted")).toBe(true);
  });

  it("cannot text the same customer 50 times after a worker crash", async () => {
    const ctx = ownerCtx();
    const to = "+15555550199";
    for (let i = 0; i < MAX_CUSTOMER_MESSAGES_PER_DAY; i += 1) {
      const claim = await claimCustomerMessage({ organizationId: ctx.organizationId, to, kind: "missed-call-follow-up" });
      expect(claim.allowed).toBe(true);
    }
    const blocked = await claimCustomerMessage({
      organizationId: ctx.organizationId,
      to,
      kind: "missed-call-follow-up",
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.count).toBeGreaterThanOrEqual(MAX_CUSTOMER_MESSAGES_PER_DAY);
  });

  it("worker SMS path stops after the daily cap even with new job ids", async () => {
    const ctx = ownerCtx();
    const to = "+15555550999";
    for (let i = 0; i < MAX_CUSTOMER_MESSAGES_PER_DAY + 2; i += 1) {
      await handleQueuedWork("missed-call-follow-up", {
        jobId: `job_sms_${i}`,
        organizationId: ctx.organizationId,
        userId: "atlas",
        payload: { phone: to },
      });
    }
    const logs = listAudit(ctx.organizationId);
    expect(logs.some((row) => row.action.includes("worker:rate_limited:"))).toBe(true);
  });

  it("retries a job after a crash (in-flight is not treated as completed)", () => {
    expect(beginJob("job_retry")).toBe("ok");
    finishJob("job_retry", false);
    expect(beginJob("job_retry")).toBe("ok");
    finishJob("job_retry", true);
    expect(beginJob("job_retry")).toBe("duplicate");
  });

  it("free plan cannot raise Autopilot", () => {
    expect(maxAutonomyLevelForPlan("free")).toBe(1);
    const ctx = ownerCtx();
    const db = database();
    saveDatabase({
      ...db,
      subscriptions: db.subscriptions.map((row) =>
        row.orgId === ctx.organizationId ? { ...row, plan: "free" as const, seats: 1 } : row,
      ),
    });
    patchPolicy(ctx.organizationId, { level: 4 });
    const submitted = submitWork(ctx, {
      kind: "send_reminder",
      title: "Reminder",
      summary: "Tomorrow",
    });
    expect(submitted.decision.verdict).toBe("ask_owner");
    expect(submitted.decision.reason).toMatch(/Manual mode/);
  });
});

describe("Tenant isolation", () => {
  beforeEach(() => {
    resetDatabase();
  });

  function seedOrgB() {
    const stamp = new Date().toISOString();
    const orgB = `org_b_${Date.now()}`;
    const userB = `user_b_${Date.now()}`;
    saveDatabase({
      ...database(),
      users: [
        ...database().users,
        {
          id: userB,
          email: "b@example.com",
          full_name: "Owner B",
          profile_image: null,
          timezone: "America/Chicago",
          preferred_language: "en",
          email_verified_at: stamp,
          created_at: stamp,
          updated_at: stamp,
        },
      ],
      organizations: [
        ...database().organizations,
        {
          id: orgB,
          owner_id: userB,
          business_name: "Company B",
          logo_url: null,
          business_type: "HVAC",
          tax_structure: "LLC",
          state: "TX",
          created_at: stamp,
        },
      ],
      organization_members: [
        ...database().organization_members,
        {
          id: `om_${userB}`,
          organization_id: orgB,
          user_id: userB,
          role: "owner",
          status: "active",
          joined_at: stamp,
        },
      ],
    });
    return { orgB, userB, ownerB: testSession(userB, orgB, "owner") };
  }

  it("Company A never sees Company B customers, transactions, or audit logs", () => {
    const db = database();
    const orgA = db.organizations[0]!;
    const ownerA = testSession(db.users[0]!.id, orgA.id, "owner");
    const { orgB, ownerB } = seedOrgB();
    submitWork(ownerA, { kind: "send_reminder", title: "A reminder", summary: "A" });
    createCustomer(ownerB, { name: "Secret B LLC", email: "secret-b@example.com" });
    expect(listCustomers(ownerB).some((row) => row.name === "Secret B LLC")).toBe(true);
    expect(listCustomers(ownerA).some((row) => row.name === "Secret B LLC")).toBe(false);
    expect(listCustomers(ownerA).every((row) => row.organizationId === orgA.id)).toBe(true);
    expect(listOrgTransactions(ownerB).every((row) => row.organizationId === orgB)).toBe(true);
    const auditA = listAudit(orgA.id);
    const auditB = listAudit(orgB);
    expect(auditA.every((row) => row.organization_id === orgA.id)).toBe(true);
    expect(auditB.every((row) => row.organization_id === orgB)).toBe(true);
    expect(auditA.some((row) => row.organization_id === orgB)).toBe(false);
    expect(subscriptionForOrg(orgB)).toBeNull();
  });

  it("Stripe checkout and webhooks bind the paying organization only", async () => {
    const orgA = database().organizations[0]!.id;
    const { orgB } = seedOrgB();
    const checkout = await createCheckoutSession({ organizationId: orgB });
    expect(checkout.organizationId).toBe(orgB);
    expect(subscriptionForOrg(orgB)?.plan).toBe("business");
    expect(subscriptionForOrg(orgA)?.orgId).toBe(orgA);
    await handleStripeWebhook(
      JSON.stringify({
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_b",
            customer: "cus_b",
            subscription: "sub_b",
            metadata: { organization_id: orgB },
          },
        },
      }),
      null,
    );
    expect(stripeAccountForOrg(orgB)?.customerId).toBe("cus_b");
    expect(stripeAccountForOrg(orgA)?.customerId).not.toBe("cus_b");
  });
});

describe("Privacy, recovery, secrets, support", () => {
  beforeEach(() => {
    resetDatabase();
  });

  it("exports only this organization's records", () => {
    const db = database();
    const ctx = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const dump = exportOrganization(ctx);
    expect(dump.organization?.id).toBe(ctx.organizationId);
    expect(dump.customers.every((row) => row.organization_id === ctx.organizationId)).toBe(true);
    expect(JSON.stringify(dump)).not.toMatch(/password_hash/);
  });

  it("owner can delete org operational data and keep the audit of that delete", () => {
    const db = database();
    const ctx = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const before = database().customers.length;
    expect(before).toBeGreaterThan(0);
    deleteOrganizationData(ctx);
    expect(database().customers.filter((row) => row.organization_id === ctx.organizationId)).toHaveLength(0);
    expect(listAudit(ctx.organizationId).some((row) => row.action === "privacy.delete")).toBe(true);
  });

  it("employee cannot take a support snapshot", () => {
    const db = database();
    const manager = db.organization_members.find((row) => row.role === "manager" && row.status === "active");
    expect(manager).toBeTruthy();
    const ctx = testSession(manager!.user_id, manager!.organization_id, "manager");
    expect(() => supportSnapshot(ctx)).toThrow(AuthorizationError);
  });

  it("account recovery issues a one-time reset token", () => {
    const db = database();
    const token = createPasswordReset(db.users[0]!.id);
    expect(token.length).toBeGreaterThan(8);
    const userId = consumePasswordReset(token, "new-password-atlas1");
    expect(userId).toBe(db.users[0]!.id);
    expect(() => consumePasswordReset(token, "another-pass-atlas1")).toThrow();
  });

  it("does not put secrets on NEXT_PUBLIC_ keys", () => {
    expect(assertNoClientSecrets({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" })).toEqual([]);
    expect(assertNoClientSecrets({ NEXT_PUBLIC_STRIPE_SECRET: "sk_test" }).length).toBeGreaterThan(0);
  });

  it("redacts known secrets from log lines", () => {
    const previous = process.env.STRIPE_SECRET_KEY;
    process.env.STRIPE_SECRET_KEY = "sk_live_super_secret_value";
    expect(redactSecrets("using sk_live_super_secret_value")).toBe("using [redacted]");
    if (previous === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous;
  });

  it("records a dead letter for exhausted jobs", () => {
    const row = recordDeadLetter({
      jobId: "job_x",
      kind: "vendor_payment",
      organizationId: "org_test",
      error: "card declined",
      attempts: 3,
    });
    expect(listDeadLetters("org_test").some((item) => item.id === row.id)).toBe(true);
  });

  it("owner support snapshot stays inside the session organization", () => {
    const db = database();
    const ctx = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const snap = supportSnapshot(ctx);
    expect(snap.organizationId).toBe(ctx.organizationId);
    expect(snap.subscription?.orgId).toBe(ctx.organizationId);
    expect(snap.autonomy.organizationId).toBe(ctx.organizationId);
  });

  it("free plan cannot invite past the seat cap", () => {
    const db = database();
    const orgId = db.organizations[0]!.id;
    saveDatabase({
      ...db,
      subscriptions: db.subscriptions.map((row) =>
        row.orgId === orgId ? { ...row, plan: "free" as const, seats: 1 } : row,
      ),
    });
    const invited = atlasApi.organizationMembers.invite({
      organization_id: orgId,
      email: "extra@example.com",
      role: "employee",
    });
    expect(invited.success).toBe(false);
    if (!invited.success) expect(invited.status).toBe(402);
  });

  it("rate-limits abusive clients", () => {
    rateLimit("abuse-test", 2, 60_000);
    rateLimit("abuse-test", 2, 60_000);
    expect(() => rateLimit("abuse-test", 2, 60_000)).toThrow(RateLimitError);
  });

  it("encrypts secrets when ATLAS_SECRETS_KEY is set", () => {
    const previous = process.env.ATLAS_SECRETS_KEY;
    process.env.ATLAS_SECRETS_KEY = "unit-test-secret-key";
    const enc = encryptSecret("tok_live_abc");
    expect(enc.startsWith("enc:v1:")).toBe(true);
    expect(enc).not.toContain("tok_live_abc");
    expect(decryptSecret(enc)).toBe("tok_live_abc");
    if (previous === undefined) delete process.env.ATLAS_SECRETS_KEY;
    else process.env.ATLAS_SECRETS_KEY = previous;
  });

  it("restores a JSON backup after destructive edits", () => {
    const before = database().customers.length;
    expect(before).toBeGreaterThan(0);
    const file = backupJsonDatabase();
    saveDatabase({ ...database(), customers: [] });
    expect(database().customers).toHaveLength(0);
    restoreJsonDatabase(file);
    expect(database().customers.length).toBe(before);
  });

  it("worker heartbeat is readable after a touch", async () => {
    await touchWorkerHeartbeat();
    const hb = await readWorkerHeartbeat();
    expect(hb.at).toBeTruthy();
    expect(hb.stale).toBe(false);
  });

  it("integration reconnect is org-scoped and audited", async () => {
    const db = database();
    const ctx = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const result = await reconnectIntegration(ctx, "gmail");
    expect(result.action).toBe("reconnect");
    expect(listAudit(ctx.organizationId).some((row) => row.action.includes("reconnect gmail"))).toBe(true);
  });

  it("reports a runtime environment", () => {
    expect(["development", "staging", "production"]).toContain(atlasRuntimeEnv());
  });
});
