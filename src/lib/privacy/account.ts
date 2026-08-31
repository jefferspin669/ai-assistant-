import { AuthorizationError } from "@/lib/domain/errors";
import type { SessionContext } from "@/lib/domain/types";
import { requirePermission } from "@/lib/auth/permissions";
import { loadDatabase, saveDatabase } from "@/lib/db/store";
import { writeAudit } from "@/lib/services/audit";
import { requireOrgMember } from "@/lib/services/access";
import { getPolicy } from "@/lib/autonomy/policy";
import { subscriptionForOrg } from "@/lib/billing/entitlements";

export function exportOrganization(ctx: SessionContext) {
  const db = loadDatabase();
  requireOrgMember(db, ctx);
  requirePermission(ctx, "audit.read");
  const orgId = ctx.organizationId;
  writeAudit(ctx, { action: "privacy.export", entityType: "organization", entityId: orgId });
  return {
    exportedAt: new Date().toISOString(),
    organization: db.organizations.find((row) => row.id === orgId) || null,
    members: db.organization_members.filter((row) => row.organization_id === orgId),
    customers: db.customers.filter((row) => row.organization_id === orgId),
    tasks: db.tasks.filter((row) => row.orgId === orgId),
    calendar_events: db.calendar_events.filter((row) => row.organization_id === orgId),
    transactions: db.transactions.filter((row) => row.orgId === orgId),
    approvals: db.approvals.filter((row) => row.organization_id === orgId),
    audit_logs: db.audit_logs.filter((row) => row.organization_id === orgId),
    quotes: db.quotes.filter((row) => row.organization_id === orgId),
    jobs: db.jobs.filter((row) => row.organization_id === orgId),
    subscriptions: db.subscriptions.filter((row) => row.orgId === orgId),
  };
}

/** Owner-only deletion of this organization's live records. Credentials of other orgs stay. */
export function deleteOrganizationData(ctx: SessionContext) {
  if (ctx.role !== "owner") {
    throw new AuthorizationError("Only the owner can delete organization data.");
  }
  const db = loadDatabase();
  requireOrgMember(db, ctx);
  const orgId = ctx.organizationId;
  writeAudit(ctx, {
    action: "privacy.delete",
    entityType: "organization",
    entityId: orgId,
    actorLabel: ctx.userId,
  });
  const latest = loadDatabase();
  saveDatabase({
    ...latest,
    customers: latest.customers.filter((row) => row.organization_id !== orgId),
    tasks: latest.tasks.filter((row) => row.orgId !== orgId),
    calendar_events: latest.calendar_events.filter((row) => row.organization_id !== orgId),
    transactions: latest.transactions.filter((row) => row.orgId !== orgId),
    approvals: latest.approvals.filter((row) => row.organization_id !== orgId),
    quotes: latest.quotes.filter((row) => row.organization_id !== orgId),
    jobs: latest.jobs.filter((row) => row.organization_id !== orgId),
    documents: latest.documents.filter((row) => row.orgId !== orgId),
    notifications: latest.notifications.filter((row) => row.organizationId !== orgId),
  });
  void import("@/lib/orchestrator/store").then((mod) => mod.deleteOrgOrchestratorState(orgId));
  return { deleted: true, organizationId: orgId };
}

export function supportSnapshot(ctx: SessionContext) {
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    throw new AuthorizationError("Support snapshot is owner/admin only.");
  }
  const db = loadDatabase();
  requireOrgMember(db, ctx);
  const orgId = ctx.organizationId;
  return {
    organizationId: orgId,
    usersInOrg: db.organization_members.filter((row) => row.organization_id === orgId).length,
    customers: db.customers.filter((row) => row.organization_id === orgId).length,
    jobsQueued: db.jobs.filter((row) => row.organization_id === orgId && row.status === "queued").length,
    pendingApprovals: db.approvals.filter((row) => row.organization_id === orgId && row.status === "pending")
      .length,
    auditEvents: db.audit_logs.filter((row) => row.organization_id === orgId).length,
    subscription: subscriptionForOrg(orgId),
    autonomy: getPolicy(orgId),
    lastAudit: db.audit_logs.filter((row) => row.organization_id === orgId).slice(0, 8),
  };
}
