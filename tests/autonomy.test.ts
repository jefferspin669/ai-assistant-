import { beforeEach, describe, expect, it } from "vitest";
import { decideWork, isAwayPhrase, levelFromAwayPhrase } from "../src/lib/autonomy/engine";
import { defaultPolicy } from "../src/lib/autonomy/defaults";
import { demoVendorPayment, submitWork } from "../src/lib/autonomy/submit";
import { patchPolicy } from "../src/lib/autonomy/policy";
import { processAutonomyQueue } from "../src/lib/autonomy/worker";
import { enqueueJob, processJobs } from "../src/lib/services/jobs";
import type { AutonomyLevel, AutonomyPolicy, WorkIntent } from "../src/lib/autonomy/types";
import { AUTONOMOUS_AUTO_PERMISSIONS, levelToControlMode } from "../src/lib/autonomy/permissions";
import { resetDatabase, saveDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { createOrgProject } from "../src/lib/services/workspace";
import { resolveApproval } from "../src/lib/domain/actions";

function policy(level: AutonomyLevel, extra: Partial<AutonomyPolicy> = {}): AutonomyPolicy {
  return {
    ...defaultPolicy("org_test"),
    level,
    controlMode: levelToControlMode(level),
    autoPermissions:
      level >= 3 ? { ...AUTONOMOUS_AUTO_PERMISSIONS } : defaultPolicy("org_test").autoPermissions,
    ...extra,
  };
}

function reminder(): WorkIntent {
  return { kind: "send_reminder", title: "Appointment reminder", summary: "Text Jamie about tomorrow 9am" };
}

function vendor(amountCents = 1_842_000): WorkIntent {
  return {
    kind: "vendor_payment",
    title: "Vendor payment",
    summary: "HVAC Parts Co",
    amountCents,
  };
}

describe("Atlas autonomy engine", () => {
  it("Level 1 always asks, even for routine reminders", () => {
    const decision = decideWork(reminder(), policy(1));
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.reason).toMatch(/Manual mode/);
  });

  it("Level 2 executes routine work and still asks for refunds", () => {
    expect(decideWork(reminder(), policy(2)).verdict).toBe("execute");
    const refund = decideWork(
      { kind: "refund", title: "Customer refund", summary: "Goodwill", amountCents: 5_000 },
      policy(2),
    );
    expect(refund.verdict).toBe("ask_owner");
  });

  it("Level 3 refunds $50 automatically and asks for $200", () => {
    const under = decideWork(
      { kind: "refund", title: "Customer refund", summary: "Small refund", amountCents: 5_000 },
      policy(3),
    );
    const over = decideWork(
      { kind: "refund", title: "Customer refund", summary: "Large refund", amountCents: 20_000 },
      policy(3),
    );
    expect(under.verdict).toBe("execute");
    expect(over.verdict).toBe("ask_owner");
    expect(over.ownerPrompt).toContain("Your automatic-refund limit: $100");
  });

  it("payroll is never unrestricted, even on Autopilot", () => {
    const decision = decideWork(
      { kind: "payroll_change", title: "Payroll change", summary: "Raise Alex to $32/hr" },
      policy(4),
    );
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.band).toBe("restricted");
    expect(decision.ownerPrompt).toContain("Atlas needs you");
  });

  it("vendor payment $18,420 vs $5,000 auto-pay limit asks with the owner card", () => {
    const decision = decideWork(vendor(), policy(4));
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.ownerPrompt).toContain("Atlas needs you");
    expect(decision.ownerPrompt).toContain("Vendor payment: $18,420");
    expect(decision.ownerPrompt).toContain("Your automatic-payment limit: $5,000");
  });

  it("kill switch forces ask even for Level 4 reminders", () => {
    const decision = decideWork(reminder(), policy(4, { killSwitch: true }));
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.reason).toMatch(/Kill switch/);
  });

  it("vacation / run the company raises to Autopilot", () => {
    expect(isAwayPhrase("I'm going on vacation. Run the company.")).toBe(true);
    expect(levelFromAwayPhrase("I'm going on vacation. Run the company.")).toBe(4);
    expect(levelFromAwayPhrase("Going home — handle tonight")).toBe(2);
  });

  it("disabled auto permission asks even at Level 2", () => {
    const policy = {
      ...defaultPolicy("org_test"),
      level: 2 as const,
      controlMode: "assisted" as const,
      autoPermissions: { ...defaultPolicy("org_test").autoPermissions, reminders: false },
    };
    const decision = decideWork(reminder(), policy);
    expect(decision.verdict).toBe("ask_owner");
    expect(decision.reason).toMatch(/reminder/i);
  });

  it("expired automatic authority asks the owner", () => {
    const expired = {
      ...defaultPolicy("org_test"),
      level: 4 as const,
      controlMode: "autonomous" as const,
      activeUntil: "2020-01-01T00:00:00.000Z",
    };
    expect(decideWork(reminder(), expired).verdict).toBe("ask_owner");
  });
});

describe("Atlas autonomy queue", () => {
  beforeEach(() => {
    resetDatabase();
  });

  function ownerCtx() {
    const db = database();
    return testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
  }

  function allowAutomaticTasks(ctx: ReturnType<typeof ownerCtx>) {
    const db = database();
    saveDatabase({
      ...db,
      subscriptions: db.subscriptions.map((item) =>
        item.orgId === ctx.organizationId ? { ...item, plan: "business" as const } : item,
      ),
    });
    patchPolicy(ctx.organizationId, { level: 3 });
  }

  it("persists an assigned task and reports its real ID only after a tick", () => {
    const ctx = ownerCtx();
    allowAutomaticTasks(ctx);
    const project = createOrgProject(ctx, { name: "Autonomy test" });
    const submitted = submitWork(ctx, {
      kind: "assign_task",
      title: "Inspect site",
      summary: "Inspect site",
      payload: { title: "Inspect site", projectId: project.id },
    });
    expect(submitted.jobId).toBeTruthy();
    expect(database().tasks.some((row) => row.title === "Inspect site")).toBe(false);
    const tick = processAutonomyQueue();
    expect(tick.processed).toBe(1);
    const job = database().jobs.find((row) => row.id === submitted.jobId);
    expect(job?.status).toBe("done");
    expect(database().tasks.find((row) => row.id === job?.payload.resultTaskId)?.projectId).toBe(
      project.id,
    );
    expect(processAutonomyQueue().processed).toBe(0);
    expect(database().tasks.filter((row) => row.title === "Inspect site")).toHaveLength(1);
  });

  it("honors a kill switch activated after a task was queued", () => {
    const ctx = ownerCtx();
    allowAutomaticTasks(ctx);
    const submitted = submitWork(ctx, {
      kind: "assign_task",
      title: "Paused task",
      summary: "Pause",
      payload: { title: "Paused task" },
    });
    patchPolicy(ctx.organizationId, { killSwitch: true });
    expect(processAutonomyQueue().skippedKillSwitch).toBe(1);
    expect(database().jobs.find((row) => row.id === submitted.jobId)?.status).toBe("failed");
    expect(database().tasks.some((row) => row.title === "Paused task")).toBe(false);
  });

  it("rejects a stale requester and an assignee from another business", () => {
    const ctx = ownerCtx();
    allowAutomaticTasks(ctx);
    const submitted = submitWork(ctx, {
      kind: "assign_task",
      title: "No access",
      summary: "Test",
      payload: { title: "No access", assigneeId: "other_business_employee" },
    });
    expect(processAutonomyQueue().processed).toBe(0);
    expect(database().jobs.find((row) => row.id === submitted.jobId)?.status).toBe("failed");
    const next = submitWork(ctx, {
      kind: "assign_task",
      title: "Revoked manager",
      summary: "Test",
      payload: { title: "Revoked manager" },
    });
    const db = database();
    saveDatabase({
      ...db,
      organization_members: db.organization_members.map((row) =>
        row.user_id === ctx.userId && row.organization_id === ctx.organizationId
          ? { ...row, status: "suspended" as const }
          : row,
      ),
    });
    expect(processAutonomyQueue().processed).toBe(0);
    expect(database().jobs.find((row) => row.id === next.jobId)?.status).toBe("failed");
    expect(database().tasks.some((row) => row.title === "Revoked manager")).toBe(false);
  });

  it("executes a manually approved task with its selected project", async () => {
    const ctx = ownerCtx();
    const project = createOrgProject(ctx, { name: "Approval test" });
    const submitted = submitWork(ctx, {
      kind: "assign_task",
      title: "Review roof",
      summary: "Review roof",
      payload: { title: "Review roof", projectId: project.id },
    });
    expect(submitted.approvalId).toBeTruthy();
    expect(database().tasks.some((row) => row.title === "Review roof")).toBe(false);
    await resolveApproval(ctx, submitted.approvalId!, "approved");
    expect(database().tasks.find((row) => row.title === "Review roof")?.projectId).toBe(project.id);
  });

  it("demo vendor payment creates a pending owner card", () => {
    const ctx = ownerCtx();
    const submitted = demoVendorPayment(ctx);
    expect(submitted.decision.verdict).toBe("ask_owner");
    expect(submitted.approvalId).toBeTruthy();
    expect(submitted.decision.ownerPrompt).toContain("Vendor payment: $18,420");
    const pending = database().approvals.filter((row) => row.status === "pending");
    expect(pending.some((row) => row.id === submitted.approvalId)).toBe(true);
  });

  it("within-authority work does not enqueue a fake completion job", () => {
    const ctx = ownerCtx();
    patchPolicy(ctx.organizationId, { level: 3 });
    const submitted = submitWork(ctx, {
      kind: "refund",
      title: "Customer refund",
      summary: "Goodwill",
      amountCents: 5_000,
    });
    expect(submitted.decision.verdict).toBe("blocked");
    expect(submitted.jobId).toBeUndefined();
    expect(submitted.decision.reason).toMatch(/executor/i);
    const tick = processAutonomyQueue();
    expect(tick.processed).toBe(0);
  });

  it("kill switch leaves queued autonomy jobs unprocessed", () => {
    const ctx = ownerCtx();
    patchPolicy(ctx.organizationId, { level: 4 });
    enqueueJob(ctx, "autonomy:send_reminder", { userId: ctx.userId });
    patchPolicy(ctx.organizationId, { killSwitch: true });
    const tick = processAutonomyQueue();
    expect(tick.processed).toBe(0);
    expect(tick.unsupported).toBeGreaterThan(0);
  });

  it("legacy autonomy jobs fail visibly instead of reporting completion", () => {
    const ctx = ownerCtx();
    patchPolicy(ctx.organizationId, { level: 4 });
    const job = enqueueJob(ctx, "autonomy:send_reminder", { userId: ctx.userId });
    const tick = processAutonomyQueue();
    expect(tick.processed).toBe(0);
    expect(tick.unsupported).toBe(1);
    expect(database().jobs.find((entry) => entry.id === job.id)?.status).toBe("failed");
  });

  it("kill switch fails unsupported queued jobs visibly", () => {
    const ctx = ownerCtx();
    patchPolicy(ctx.organizationId, { level: 4 });
    const job = enqueueJob(ctx, "autonomy:send_reminder", { userId: ctx.userId });
    patchPolicy(ctx.organizationId, { killSwitch: true });
    const tick = processAutonomyQueue();
    expect(tick.processed).toBe(0);
    expect(database().jobs.find((entry) => entry.id === job.id)?.status).toBe("failed");
  });

  it("does not report an unexecuted generic job as completed", () => {
    const ctx = ownerCtx();
    const job = enqueueJob(ctx, "request_payment", { userId: ctx.userId });
    const tick = processJobs();
    expect(tick.unsupported).toBe(1);
    expect(database().jobs.find((entry) => entry.id === job.id)?.status).toBe("failed");
    expect(database().notifications.some((item) => item.title.includes("finished"))).toBe(false);
  });

  it("changing mode does not switch off an existing emergency pause", () => {
    const ctx = ownerCtx();
    patchPolicy(ctx.organizationId, { killSwitch: true });
    const updated = patchPolicy(ctx.organizationId, { controlMode: "autonomous" });
    expect(updated.killSwitch).toBe(true);
    expect(decideWork(reminder(), updated).verdict).toBe("ask_owner");
  });
});
