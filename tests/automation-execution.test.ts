import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase, saveDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { createOrgProject } from "../src/lib/services/workspace";
import { patchPolicy } from "../src/lib/autonomy/policy";
import { submitWork } from "../src/lib/autonomy/submit";
import { processAutonomyQueue } from "../src/lib/autonomy/worker";
import { resolveApproval } from "../src/lib/domain/actions";
import { handleQueuedWork } from "../src/lib/queue/handlers";
import { resetIdempotencyForTests } from "../src/lib/safety/idempotency";

function owner() { const db = database(); return testSession(db.users[0].id, db.organizations[0].id, "owner"); }
function enableTasks() {
  const ctx = owner(), db = database();
  saveDatabase({ ...db, subscriptions: db.subscriptions.map((row) => row.orgId === ctx.organizationId
    ? { ...row, plan: "business" as const } : row) });
  patchPolicy(ctx.organizationId, { level: 3 });
  return ctx;
}
describe("real automation execution", () => {
  beforeEach(() => { resetDatabase(); resetIdempotencyForTests(); });
  it("saves one real task for repeated submission with the same action key", () => {
    const ctx = enableTasks(), project = createOrgProject(ctx, { name: "Roof repair" });
    const intent = { kind: "assign_task" as const, title: "Inspect roof", summary: "Inspect roof",
      payload: { title: "Inspect roof", projectId: project.id, idempotencyKey: "roof-inspection-1" } };
    const first = submitWork(ctx, intent), second = submitWork(ctx, intent);
    expect(first.jobId).toBeTruthy();
    expect(first.jobId).toBe(second.jobId);
    expect(processAutonomyQueue().processed).toBe(1);
    expect(processAutonomyQueue().processed).toBe(0);
    const job = database().jobs.find((row) => row.id === first.jobId)!;
    expect(database().tasks.find((row) => row.id === job.payload.resultTaskId)?.projectId).toBe(project.id);
    expect(database().tasks.filter((row) => row.title === "Inspect roof")).toHaveLength(1);
  });
  it("rechecks the emergency pause after queueing", () => {
    const ctx = enableTasks();
    submitWork(ctx, { kind: "assign_task", title: "Pause", summary: "Pause", payload: { title: "Paused task" } });
    patchPolicy(ctx.organizationId, { killSwitch: true });
    expect(processAutonomyQueue().skippedKillSwitch).toBe(1);
    expect(database().tasks.some((row) => row.title === "Paused task")).toBe(false);
  });
  it("blocks a requester whose management authority was revoked", () => {
    const ctx = enableTasks();
    submitWork(ctx, { kind: "assign_task", title: "Revoked", summary: "Revoked", payload: { title: "Revoked task" } });
    const db = database();
    saveDatabase({ ...db, organization_members: db.organization_members.map((row) => row.user_id === ctx.userId
      && row.organization_id === ctx.organizationId ? { ...row, role: "employee" as const } : row) });
    expect(processAutonomyQueue().processed).toBe(0);
    expect(database().tasks.some((row) => row.title === "Revoked task")).toBe(false);
  });
  it("rejects an assignee outside the business", () => {
    const ctx = enableTasks();
    submitWork(ctx, { kind: "assign_task", title: "Foreign", summary: "Foreign",
      payload: { title: "Foreign task", assigneeId: "another-business-user" } });
    expect(processAutonomyQueue().processed).toBe(0);
    expect(database().tasks.some((row) => row.title === "Foreign task")).toBe(false);
  });
  it("creates a project task only after human approval in manual mode", async () => {
    const ctx = owner(), project = createOrgProject(ctx, { name: "Human review" });
    const submitted = submitWork(ctx, { kind: "assign_task", title: "Review", summary: "Review",
      payload: { title: "Review task", projectId: project.id, dueDate: null } });
    expect(submitted.approvalId).toBeTruthy();
    expect(database().tasks.some((row) => row.title === "Review task")).toBe(false);
    await resolveApproval(ctx, submitted.approvalId!, "approved");
    expect(database().tasks.find((row) => row.title === "Review task")?.projectId).toBe(project.id);
  });
  it("never reports an unconfigured provider as a successful customer send", async () => {
    const ctx = owner();
    await expect(handleQueuedWork("send_message", { jobId: "unconfigured-send", organizationId: ctx.organizationId,
      userId: ctx.userId, payload: { phone: "+15555550123", body: "Follow up" } })).rejects.toThrow(/Live SMS/);
    expect(database().audit_logs.some((row) => row.action === "sent customer notification")).toBe(false);
  });
});
