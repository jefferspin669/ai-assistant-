/**
 * Team operations beachhead: invite → project → assign → complete → approve notify → audit.
 * Server-authoritative; no demo seed on this path.
 */

import { hashPassword } from "@/lib/auth/password";
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from "@/lib/domain/errors";
import { requirePermission } from "@/lib/auth/permissions";
import { canManageProjectTasks } from "@/lib/rules/engine";
import { awaitDatabaseWrites, newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { DbOrganizationMember, DbUser, DbUserCredential } from "@/lib/db/schema";
import type { OrgRole, SessionContext } from "@/lib/domain/types";
import { database, requireOrgMember, requireTask } from "@/lib/services/access";
import { listAudit, writeAudit } from "@/lib/services/audit";
import {
  createCustomer,
  createOrgProject,
  createOrgTask,
  listOrgProjects,
  listOrgTasks,
  updateOrgTask,
} from "@/lib/services/workspace";
import { listApprovals } from "@/lib/services/approvals";
import { resolveApproval } from "@/lib/domain/actions";

export function inviteWorker(
  ctx: SessionContext,
  input: { email: string; fullName?: string; role?: OrgRole },
) {
  const db = database();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "employees.manage");
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new ValidationError("Provide a valid email.");
  const role = input.role || "employee";
  if (role === "owner") throw new ValidationError("Cannot invite another owner via this flow.");

  let user = db.users.find((row) => row.email === email);
  const stamp = nowIso();
  if (!user) {
    const userId = newId("user");
    user = {
      id: userId,
      email,
      full_name: input.fullName?.trim() || email.split("@")[0] || "Worker",
      profile_image: null,
      timezone: "America/Chicago",
      preferred_language: "en",
      email_verified_at: null,
      created_at: stamp,
      updated_at: stamp,
    } satisfies DbUser;
    const credential: DbUserCredential = {
      user_id: userId,
      password_hash: hashPassword("atlas-worker"),
      mfa_secret: null,
      mfa_enabled: false,
    };
    saveDatabase({
      ...db,
      users: [user, ...db.users],
      user_credentials: [credential, ...db.user_credentials],
    });
  }

  const fresh = database();
  if (
    fresh.organization_members.some(
      (row) =>
        row.organization_id === ctx.organizationId &&
        row.user_id === user!.id &&
        row.status !== "removed",
    )
  ) {
    throw new ConflictError("User is already a member of this organization.");
  }

  const member: DbOrganizationMember = {
    id: newId("om"),
    organization_id: ctx.organizationId,
    user_id: user.id,
    role,
    status: "invited",
    joined_at: stamp,
  };
  saveDatabase({
    ...fresh,
    organization_members: [member, ...fresh.organization_members],
  });
  writeAudit(ctx, { action: "invited worker", entityType: "organization_member", entityId: member.id });
  return { member, user };
}

export function acceptWorkerInvite(
  ctx: SessionContext,
  input: { memberId?: string; email?: string },
) {
  const db = database();
  const member = db.organization_members.find((row) => {
    if (row.organization_id !== ctx.organizationId) return false;
    if (row.status !== "invited") return false;
    if (input.memberId) return row.id === input.memberId;
    if (input.email) {
      const user = db.users.find((u) => u.id === row.user_id);
      return user?.email === input.email.trim().toLowerCase();
    }
    return row.user_id === ctx.userId;
  });
  if (!member) throw new NotFoundError("Invite not found.");
  if (member.user_id !== ctx.userId && !canManageProjectTasks(ctx.role)) {
    throw new AuthorizationError("Only the invited worker or an owner can accept this invite.");
  }
  const next = { ...member, status: "active" as const, joined_at: nowIso() };
  saveDatabase({
    ...db,
    organization_members: db.organization_members.map((row) => (row.id === member.id ? next : row)),
  });
  writeAudit(ctx, { action: "accepted worker invite", entityType: "organization_member", entityId: member.id });
  return next;
}

export function completeTaskAsAssignee(ctx: SessionContext, taskId: string) {
  const db = database();
  requireOrgMember(db, ctx);
  const task = requireTask(db, ctx, taskId);
  if (!task.assigneeId) throw new ValidationError("Task has no assignee.");
  // Owner/manager may trigger completion through the worker's rule path for the beachhead UI.
  if (task.assigneeId !== ctx.userId && !canManageProjectTasks(ctx.role)) {
    throw new AuthorizationError("Only the assignee or a manager can complete this task.");
  }
  const workerCtx: SessionContext = {
    userId: task.assigneeId,
    organizationId: ctx.organizationId,
    role: "employee",
    sessionId: `${ctx.sessionId}:as-assignee`,
  };
  return updateOrgTask(workerCtx, taskId, { status: "completed" });
}

export function teamOpsSnapshot(ctx: SessionContext) {
  const db = database();
  requireOrgMember(db, ctx);
  const members = db.organization_members
    .filter((row) => row.organization_id === ctx.organizationId && row.status !== "removed")
    .map((row) => {
      const user = db.users.find((u) => u.id === row.user_id);
      return {
        id: row.id,
        userId: row.user_id,
        email: user?.email || "",
        name: user?.full_name || "",
        role: row.role,
        status: row.status,
      };
    });
  return {
    members,
    projects: listOrgProjects(ctx),
    tasks: listOrgTasks(ctx),
    approvals: listApprovals(ctx).filter((row) => row.status === "pending"),
    audit: listAudit(ctx.organizationId).slice(0, 40),
  };
}

/** Full beachhead path used by API tests and the workforce Team Ops panel. */
export async function runTeamOpsHappyPath(owner: SessionContext, workerEmail: string) {
  const invited = inviteWorker(owner, { email: workerEmail, fullName: "Worker One", role: "employee" });
  const accepted = acceptWorkerInvite(
    { ...owner, userId: invited.user.id, role: "employee" },
    { memberId: invited.member.id },
  );
  const customer = createCustomer(owner, {
    name: "Live Customer Co",
    phone: "+15555550199",
    email: "ops@livecustomer.example",
    status: "active",
  });
  const project = createOrgProject(owner, {
    name: "Roof repair",
    description: "First live project — no demo seed.",
  });
  const task = createOrgTask(owner, {
    title: "Inspect flashing",
    projectId: project.id,
    assigneeId: invited.user.id,
    customerId: customer.id,
    notifyOnComplete: true,
  });
  const completed = completeTaskAsAssignee(owner, task.id);
  void invited;
  const pending = listApprovals(owner).find(
    (row) => row.status === "pending" && row.action_type === "SEND_MESSAGE",
  );
  if (!pending) throw new ValidationError("Expected customer notification approval after task complete.");
  const resolved = resolveApproval(owner, pending.id, "approved");
  await awaitDatabaseWrites();
  return {
    member: accepted,
    project,
    task: completed,
    approval: resolved.approval,
    audit: listAudit(owner.organizationId),
  };
}
