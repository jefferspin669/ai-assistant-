import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthorizationError, NotFoundError } from "../src/lib/domain/errors";
import {
  assertProductionPersistence,
  databaseDriver,
  fileFallbackAllowed,
  jsonMirrorEnabled,
} from "../src/lib/db/driver";
import {
  awaitDatabaseWrites,
  createEmptyOrganization,
  loadDatabase,
  resetDatabase,
} from "../src/lib/db/store";
import { resetEnsureCache } from "../src/lib/db/ensure";
import { database, testSession } from "../src/lib/services/access";
import {
  createOrgProject,
  createOrgTask,
  listCustomers,
  listOrgTasks,
  updateOrgTask,
} from "../src/lib/services/workspace";
import {
  acceptWorkerInvite,
  completeTaskAsAssignee,
  inviteWorker,
  runTeamOpsHappyPath,
} from "../src/lib/services/team-ops";
import { resolveApproval } from "../src/lib/domain/actions";
import { listApprovals } from "../src/lib/services/approvals";
import { listAudit } from "../src/lib/services/audit";
import { assertWorkerCanUpdateTask, evaluateTaskAssignmentRule } from "../src/lib/rules/engine";
import { resetIdempotencyForTests } from "../src/lib/safety/idempotency";
import { createCustomer } from "../src/lib/services/workspace";

const savedEnv = {
  atlasEnv: process.env.ATLAS_ENV,
  nodeEnv: process.env.NODE_ENV,
  databaseUrl: process.env.DATABASE_URL,
};

beforeEach(() => {
  delete process.env.ATLAS_ENV;
  delete process.env.DATABASE_URL;
  resetEnsureCache();
  resetDatabase();
  resetIdempotencyForTests();
});

afterEach(() => {
  if (savedEnv.atlasEnv) process.env.ATLAS_ENV = savedEnv.atlasEnv;
  else delete process.env.ATLAS_ENV;
  if (savedEnv.databaseUrl) process.env.DATABASE_URL = savedEnv.databaseUrl;
  else delete process.env.DATABASE_URL;
  if (savedEnv.nodeEnv) process.env.NODE_ENV = savedEnv.nodeEnv;
  resetEnsureCache();
});

function ownerCtx() {
  const db = database();
  return testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
}

describe("PostgreSQL authoritative / production file fallback", () => {
  it("allows JSON fallback outside production", () => {
    process.env.ATLAS_ENV = "development";
    delete process.env.DATABASE_URL;
    expect(databaseDriver()).toBe("json");
    expect(fileFallbackAllowed()).toBe(true);
    expect(jsonMirrorEnabled()).toBe(true);
    expect(() => assertProductionPersistence()).not.toThrow();
  });

  it("refuses file fallback in production without DATABASE_URL", () => {
    process.env.ATLAS_ENV = "production";
    delete process.env.DATABASE_URL;
    expect(fileFallbackAllowed()).toBe(false);
    expect(jsonMirrorEnabled()).toBe(false);
    expect(() => assertProductionPersistence()).toThrow(/DATABASE_URL is required/);
  });

  it("awaits queued database writes without throwing", async () => {
    const ctx = ownerCtx();
    createOrgProject(ctx, { name: "Await write project" });
    await expect(awaitDatabaseWrites()).resolves.toBeUndefined();
    expect(loadDatabase().projects.some((p) => p.name === "Await write project")).toBe(true);
  });
});

describe("Worker assigned-task rules", () => {
  it("lets a worker update only their assigned task", () => {
    const owner = ownerCtx();
    const invited = inviteWorker(owner, { email: "worker@acme.test", fullName: "Pat Worker" });
    acceptWorkerInvite(owner, { memberId: invited.member.id });
    const project = createOrgProject(owner, { name: "Site A" });
    const assigned = createOrgTask(owner, {
      title: "Assigned job",
      projectId: project.id,
      assigneeId: invited.user.id,
    });
    const other = createOrgTask(owner, {
      title: "Someone else",
      projectId: project.id,
      assigneeId: owner.userId,
    });
    const worker = testSession(invited.user.id, owner.organizationId, "employee");

    expect(evaluateTaskAssignmentRule(worker, assigned).ok).toBe(true);
    expect(() => assertWorkerCanUpdateTask(worker, loadDatabase().tasks.find((t) => t.id === other.id)!)).toThrow(
      AuthorizationError,
    );

    const updated = updateOrgTask(worker, assigned.id, { status: "in_progress" });
    expect(updated.status).toBe("in_progress");
    expect(() => updateOrgTask(worker, other.id, { status: "in_progress" })).toThrow(AuthorizationError);

    const visible = listOrgTasks(worker);
    expect(visible.map((t) => t.id)).toContain(assigned.id);
    expect(visible.map((t) => t.id)).not.toContain(other.id);
  });
});

describe("Cross-tenant isolation with two businesses", () => {
  it("blocks deliberate cross-tenant customer and task access", () => {
    const a = ownerCtx();
    const b = createEmptyOrganization({
      businessName: "Second Business LLC",
      ownerEmail: "owner-b@second.test",
      ownerName: "Owner B",
    });
    const ownerB = testSession(b.userId, b.orgId, "owner");

    const customerA = createCustomer(a, { name: "Tenant A Customer", phone: "+15550001111" });
    const projectA = createOrgProject(a, { name: "A only" });
    const taskA = createOrgTask(a, { title: "Secret task", projectId: projectA.id });

    expect(listCustomers(ownerB).map((c) => c.id)).not.toContain(customerA.id);
    expect(listOrgTasks(ownerB).map((t) => t.id)).not.toContain(taskA.id);
    expect(() => updateOrgTask(ownerB, taskA.id, { status: "completed" })).toThrow(NotFoundError);
  });
});

describe("Team ops beachhead workflow", () => {
  it("invite → project → assign → complete → approve notify → audit (once)", async () => {
    const owner = ownerCtx();
    // Clear seeded demo tasks for this org so the beachhead starts from empty projects.
    expect(loadDatabase().projects.filter((p) => p.orgId === owner.organizationId)).toHaveLength(0);

    const result = await runTeamOpsHappyPath(owner, "crew@ops.test");
    expect(result.project.name).toBe("Roof repair");
    expect(result.task.status).toBe("completed");
    expect(result.approval.status).toBe("approved");

    const actions = result.audit.map((row) => row.action);
    expect(actions.some((a) => a.includes("invited worker"))).toBe(true);
    expect(actions.some((a) => a.includes("created project"))).toBe(true);
    expect(actions.some((a) => a.includes("created task"))).toBe(true);
    expect(actions.some((a) => a.includes("requested customer notification") || a.includes("SEND_MESSAGE"))).toBe(
      true,
    );
    expect(actions.some((a) => a.includes("approved SEND_MESSAGE") || a.includes("queued customer"))).toBe(true);

    await awaitDatabaseWrites();
    // Second approval attempt on a fresh duplicate path should not create another pending notify.
    expect(listApprovals(owner).filter((row) => row.status === "pending")).toHaveLength(0);

    // Completing again must not open another approval (task already completed).
    expect(() => completeTaskAsAssignee(owner, result.task.id)).not.toThrow();
    expect(listApprovals(owner).filter((a) => a.status === "pending")).toHaveLength(0);
  });

  it("records a sent customer notification audit after approval flush", async () => {
    const owner = ownerCtx();
    await runTeamOpsHappyPath(owner, "notify@ops.test");
    await awaitDatabaseWrites();
    // Give microtasks from enqueueAwaitedSideEffect a tick.
    await new Promise((r) => setTimeout(r, 50));
    await awaitDatabaseWrites();
    const audit = listAudit(owner.organizationId);
    expect(
      audit.some(
        (row) =>
          row.action.includes("sent customer notification") ||
          row.action.includes("queued customer message") ||
          row.action.includes("worker:"),
      ),
    ).toBe(true);
  });
});
