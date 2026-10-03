import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";
import { createEmptyOrganization, resetDatabase, flushDatabaseWrites } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { patchPolicy } from "../src/lib/autonomy/policy";
import { listAudit } from "../src/lib/services/audit";
import { orchestrate, getRun } from "../src/lib/orchestrator";
import { resetOrchestratorForTests, listRuns } from "../src/lib/orchestrator/store";
import { resolveApproval } from "../src/lib/domain/actions";
import { enqueueJob, claimNextJobs, completeClaimedJob, failClaimedJob, processJobs } from "../src/lib/services/jobs";
import { resetIdempotencyForTests } from "../src/lib/safety/idempotency";
import { resetDeadLettersForTests, listDeadLetters } from "../src/lib/queue/dead-letter";
import { createSession, cookieHeader, sessionFromToken } from "../src/lib/auth/session";
import { routeEvent } from "../src/lib/events/router";
import { twilioWebhookUrl } from "../src/lib/integrations/twilio-security";
import { POST as smsStatusPost } from "../src/app/api/webhooks/twilio/sms/status/route";
import { POST as approvalsPost } from "../src/app/api/approvals/route";
import { AuthenticationError } from "../src/lib/domain/errors";

function signTwilio(pathname: string, params: Record<string, string>, token: string) {
  const url = twilioWebhookUrl(pathname);
  const sorted = Object.keys(params).sort();
  let data = url;
  for (const key of sorted) data += key + (params[key] ?? "");
  return createHmac("sha1", token).update(Buffer.from(data, "utf8")).digest("base64");
}

describe("invoice recovery staging beachhead", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-06-15T15:00:00.000Z"));
    resetDatabase();
    resetOrchestratorForTests();
    resetIdempotencyForTests();
    resetDeadLettersForTests();
    delete process.env.ATLAS_SMS_FORCE_FAIL;
    process.env.TWILIO_SKIP_SIGNATURE = "1";
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.TWILIO_SKIP_SIGNATURE;
    delete process.env.ATLAS_SMS_FORCE_FAIL;
    delete process.env.TWILIO_AUTH_TOKEN;
  });

  function ownerA() {
    const db = database();
    return testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
  }

  it("claims jobs atomically and honors idempotency keys", async () => {
    const ctx = ownerA();
    const first = enqueueJob(ctx, "send_message", { userId: ctx.userId, to: "+15551230001", body: "hi" }, {
      idempotencyKey: "chase:johnson:1",
      lane: "sms",
    });
    const again = enqueueJob(ctx, "send_message", { userId: ctx.userId, to: "+15551230001", body: "hi" }, {
      idempotencyKey: "chase:johnson:1",
      lane: "sms",
    });
    expect(again.id).toBe(first.id);
    expect(database().jobs.filter((j) => j.idempotency_key === "chase:johnson:1")).toHaveLength(1);

    const claimedA = await claimNextJobs("worker-a", 10);
    const claimedB = await claimNextJobs("worker-b", 10);
    expect(claimedA.some((j) => j.id === first.id)).toBe(true);
    expect(claimedB.some((j) => j.id === first.id)).toBe(false);
    expect(database().jobs.find((j) => j.id === first.id)?.claimed_by).toBe("worker-a");

    completeClaimedJob(first.id, "worker-a");
    expect(database().jobs.find((j) => j.id === first.id)?.status).toBe("done");
  });

  it("runs overdue → draft → approve → deliver → webhook → audit for one business", async () => {
    const ctx = ownerA();
    // Level 1 forces owner approval before send.
    patchPolicy(ctx.organizationId, { level: 1, killSwitch: false });

    const event = {
      id: "evt_overdue_a",
      type: "invoice.overdue" as const,
      organizationId: ctx.organizationId,
      payload: { customerName: "Johnson Construction" },
      createdAt: new Date().toISOString(),
    };
    await routeEvent(event);

    const run = listRuns(ctx.organizationId).find((row) => row.intent === "recover_invoice");
    expect(run).toBeTruthy();
    expect(run!.status).toBe("blocked");
    const approvalStep = run!.steps.find((s) => s.kind === "approval");
    expect(approvalStep?.status).toBe("blocked");
    const approvalId = String(approvalStep?.result?.approvalId || "");
    expect(approvalId).toBeTruthy();

    const draft = run!.steps.find((s) => s.kind === "draft");
    expect(draft?.status).toBe("done");
    expect(String(draft?.result?.message || "")).toMatch(/still open/i);

    const resolved = await resolveApproval(ctx, approvalId, "approved");
    expect(resolved.result).toBeTruthy();
    await flushDatabaseWrites();

    const advanced = getRun(run!.id, ctx.organizationId);
    expect(advanced).toBeTruthy();
    expect(["waiting", "completed", "running"]).toContain(advanced!.status);
    expect(advanced!.steps.find((s) => s.kind === "approval")?.status).toBe("done");

    const audits = listAudit(ctx.organizationId);
    expect(audits.some((row) => /approved invoice_reminder|queued customer message|sent customer notification|sms\./i.test(row.action))).toBe(true);

    // Simulate Twilio delivery status webhook (test-only SID).
    process.env.TWILIO_AUTH_TOKEN = "test-twilio-token";
    delete process.env.TWILIO_SKIP_SIGNATURE;
    const params = {
      MessageSid: "SMtest_invoice_chase_001",
      MessageStatus: "delivered",
      To: "+15554412200",
      From: "+15550001111",
    };
    const body = new URLSearchParams(params).toString();
    const sig = signTwilio("/api/webhooks/twilio/sms/status", params, "test-twilio-token");
    const res = await smsStatusPost(
      new Request("http://atlas.test/api/webhooks/twilio/sms/status", {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-twilio-signature": sig,
        },
        body,
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data?.delivered || json.data?.duplicate).toBeTruthy();

    const after = listAudit(ctx.organizationId);
    expect(after.some((row) => row.action === "sms.delivered")).toBe(true);
    expect(
      database().notifications.some(
        (n) => n.organizationId === ctx.organizationId && /SMS delivered/i.test(n.title),
      ),
    ).toBe(true);
  });

  it("isolates the chase across two businesses with test-only contacts", async () => {
    const ctxA = ownerA();
    patchPolicy(ctxA.organizationId, { level: 1 });

    const bizB = createEmptyOrganization({
      businessName: "Beta HVAC LLC",
      ownerEmail: `beta-chase-${Date.now()}@trial.test`,
      ownerName: "Beta Owner",
      password: "atlas-demo",
    });
    const ctxB = testSession(bizB.userId, bizB.orgId, "owner");
    patchPolicy(ctxB.organizationId, { level: 1 });

    // Seed Business B with its own overdue customer (test-only numbers).
    const stamp = new Date().toISOString();
    const { saveDatabase } = await import("../src/lib/db/store");
    const db = database();
    const custB = {
      id: `cust_beta_${Date.now()}`,
      organization_id: bizB.orgId,
      name: "AcmeBeta",
      email: "ap@acmebeta.example",
      phone: "+15552000002",
      status: "active" as const,
      created_at: stamp,
      provenance: "LIVE" as const,
    };
    const txnB = {
      id: `txn_beta_${Date.now()}`,
      orgId: bizB.orgId,
      userId: bizB.userId,
      kind: "income" as const,
      label: "Invoice · AcmeBeta (overdue)",
      amount: 900,
      category: "invoice",
      date: "2026-04-01",
      receiptName: null,
      createdAt: stamp,
      provenance: "LIVE" as const,
    };
    saveDatabase({
      ...db,
      customers: [custB, ...db.customers],
      transactions: [txnB, ...db.transactions],
    });
    expect(database().customers.some((c) => c.id === custB.id && c.organization_id === bizB.orgId)).toBe(true);

    const { run: runA } = await orchestrate(ctxA, "Get Johnson Construction's overdue invoice paid.");
    const { run: runB } = await orchestrate(ctxB, "Get AcmeBeta's overdue invoice paid.");

    expect(runA.organizationId).toBe(ctxA.organizationId);
    expect(runB.organizationId).toBe(ctxB.organizationId);
    expect(runA.intent).toBe("recover_invoice");
    expect(runB.intent).toBe("recover_invoice");
    expect(getRun(runA.id, ctxB.organizationId)).toBeNull();
    expect(getRun(runB.id, ctxA.organizationId)).toBeNull();

    const foundA = runA.steps.find((s) => s.kind === "find_customer");
    const foundB = runB.steps.find((s) => s.kind === "find_customer");
    expect(foundA?.status).toBe("done");
    expect(foundB?.status).toBe("done");
    expect(foundA?.result?.customerName).toBe("Johnson Construction");
    expect(foundB?.result?.customerName).toBe("AcmeBeta");
    expect(foundB?.result?.phone).toBe("+15552000002");
    // Business A never sees Business B's test contact.
    expect(
      database().customers.filter((c) => c.organization_id === ctxA.organizationId).map((c) => c.phone),
    ).not.toContain("+15552000002");
  });

  it("retries provider failure then dead-letters; duplicate webhook is ignored", async () => {
    const ctx = ownerA();
    const job = enqueueJob(
      ctx,
      "send_message",
      { userId: ctx.userId, to: "+15555550000", body: "fail me", phone: "+15555550000" },
      { idempotencyKey: "fail-once", maxAttempts: 2 },
    );

    const claimed1 = await claimNextJobs("w1", 1);
    expect(claimed1[0]?.id).toBe(job.id);
    const retry = failClaimedJob(job.id, "w1", "Provider failure (test)");
    expect(retry.deadLettered).toBe(false);
    expect(database().jobs.find((j) => j.id === job.id)?.status).toBe("queued");

    // Make visible now for second claim.
    const { saveDatabase } = await import("../src/lib/db/store");
    const mid = database();
    saveDatabase({
      ...mid,
      jobs: mid.jobs.map((j) => (j.id === job.id ? { ...j, visible_at: new Date(0).toISOString() } : j)),
    });

    const claimed2 = await claimNextJobs("w1", 1);
    expect(claimed2[0]?.id).toBe(job.id);
    const dead = failClaimedJob(job.id, "w1", "Provider failure (test)");
    expect(dead.deadLettered).toBe(true);
    expect(database().jobs.find((j) => j.id === job.id)?.status).toBe("failed");
    expect(listDeadLetters(ctx.organizationId).some((d) => d.jobId === job.id)).toBe(true);

    process.env.TWILIO_AUTH_TOKEN = "test-twilio-token";
    delete process.env.TWILIO_SKIP_SIGNATURE;
    const params = {
      MessageSid: "SMdup_001",
      MessageStatus: "delivered",
      To: "+15552000002",
    };
    const body = new URLSearchParams(params).toString();
    const sig = signTwilio("/api/webhooks/twilio/sms/status", params, "test-twilio-token");
    const req = () =>
      smsStatusPost(
        new Request("http://atlas.test/api/webhooks/twilio/sms/status", {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            "x-twilio-signature": sig,
          },
          body,
        }),
      );
    const first = await req();
    expect(first.status).toBe(200);
    const second = await req();
    expect(second.status).toBe(200);
    const secondJson = await second.json();
    expect(secondJson.data?.duplicate).toBe(true);
    expect(listAudit(ctx.organizationId).filter((r) => r.action === "sms.delivered" && r.entity_id === "SMdup_001")).toHaveLength(1);
  });

  it("blocks revoked employees and honors emergency pause", async () => {
    const ctx = ownerA();
    const db = database();
    const worker = db.users.find((u) => u.email === "sam@atlas.ai") || db.users[1]!;
    const { token } = createSession(worker.id, ctx.organizationId, "employee-portal");
    expect(sessionFromToken(token).userId).toBe(worker.id);

    const { saveDatabase } = await import("../src/lib/db/store");
    const latest = database();
    saveDatabase({
      ...latest,
      organization_members: latest.organization_members.map((m) =>
        m.user_id === worker.id && m.organization_id === ctx.organizationId
          ? { ...m, status: "suspended" as const }
          : m,
      ),
    });
    expect(() => sessionFromToken(token)).toThrow(AuthenticationError);

    patchPolicy(ctx.organizationId, { level: 2, killSwitch: true });
    const { run } = await orchestrate(ctx, "Get Johnson Construction's overdue invoice paid.");
    expect(run.status).toBe("blocked");
    // Kill switch pauses before steps execute — queue/run stay blocked, not silently completed.
    expect(run.steps.every((s) => s.status === "pending" || s.status === "blocked")).toBe(true);

    // Unsupported generic jobs still fail closed under processJobs.
    const junk = enqueueJob(ctx, "request_payment", { userId: ctx.userId });
    const tick = processJobs();
    expect(tick.unsupported).toBeGreaterThanOrEqual(1);
    expect(database().jobs.find((j) => j.id === junk.id)?.status).toBe("failed");
  });

  it("HTTP approvals path advances a blocked recover_invoice run", async () => {
    const ctx = ownerA();
    patchPolicy(ctx.organizationId, { level: 1 });
    const { run } = await orchestrate(ctx, "Get Johnson Construction's overdue invoice paid.");
    const approvalId = String(run.steps.find((s) => s.kind === "approval")?.result?.approvalId || "");
    const { token } = createSession(ctx.userId, ctx.organizationId, "owner");
    const res = await approvalsPost(
      new Request("http://atlas.test/api/approvals", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: cookieHeader(token),
        },
        body: JSON.stringify({ id: approvalId, decision: "approved" }),
      }),
    );
    expect(res.status).toBe(200);
    await flushDatabaseWrites();
    const advanced = getRun(run.id, ctx.organizationId);
    expect(advanced?.steps.find((s) => s.kind === "approval")?.status).toBe("done");
  });
});
