import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/domain/errors";
import type { OrgRole, SessionContext } from "@/lib/domain/types";
import type { AtlasDatabase } from "@/lib/db/schema";
import { loadDatabase } from "@/lib/db/store";

export function database(): AtlasDatabase {
  return loadDatabase();
}

export function testSession(
  userId: string,
  organizationId: string,
  role: OrgRole = "owner",
): SessionContext {
  return { userId, organizationId, role, sessionId: "test-session" };
}

export function requireSession(ctx: Partial<SessionContext> | null | undefined): SessionContext {
  if (!ctx?.userId) throw new AuthenticationError();
  if (!ctx.organizationId) throw new AuthenticationError("Organization is required.");
  if (ctx.role && ctx.sessionId) {
    return {
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      role: ctx.role,
      sessionId: ctx.sessionId,
    };
  }
  const member = requireOrgMember(database(), ctx);
  return {
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    role: member.role as OrgRole,
    sessionId: ctx.sessionId || "service",
  };
}

export function requireOrgMember(
  db: AtlasDatabase,
  ctx: Pick<SessionContext, "userId" | "organizationId">,
) {
  const member = db.organization_members.find(
    (row) =>
      row.user_id === ctx.userId &&
      row.organization_id === ctx.organizationId &&
      row.status === "active",
  );
  if (!member) {
    throw new AuthorizationError("You are not an active member of this organization.");
  }
  return member;
}

export function requireCustomer(db: AtlasDatabase, ctx: SessionContext, customerId: string) {
  requireOrgMember(db, ctx);
  const customer = db.customers.find(
    (row) => row.id === customerId && row.organization_id === ctx.organizationId,
  );
  if (!customer) throw new NotFoundError("Customer not found.");
  return customer;
}

export function requireEvent(db: AtlasDatabase, ctx: SessionContext, eventId: string) {
  requireOrgMember(db, ctx);
  const event = db.calendar_events.find(
    (row) => row.id === eventId && row.organization_id === ctx.organizationId,
  );
  if (!event) throw new NotFoundError("Calendar event not found.");
  return event;
}

export function requireTask(db: AtlasDatabase, ctx: SessionContext, taskId: string) {
  requireOrgMember(db, ctx);
  const task = db.tasks.find((row) => row.id === taskId && row.orgId === ctx.organizationId);
  if (!task) throw new NotFoundError("Task not found.");
  return task;
}
