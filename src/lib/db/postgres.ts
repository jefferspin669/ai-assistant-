/**
 * PostgreSQL via Drizzle. When DATABASE_URL is set this is the source of truth
 * (hydrate on boot, write-through on save). JSON is the fallback adapter.
 */

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PgTable } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as schema from "@/lib/db/drizzle-schema";
import type { AtlasDatabase } from "@/lib/db/schema";

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function hasPostgres(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDrizzle() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!client) {
    client = postgres(url, { max: 5, idle_timeout: 20, connect_timeout: 8 });
    db = drizzle(client, { schema });
  }
  return db!;
}

export function getPostgres() {
  if (!hasPostgres()) return null;
  return getDrizzle();
}

export async function pingPostgres(): Promise<{ ok: boolean; error?: string }> {
  if (!hasPostgres()) return { ok: false, error: "DATABASE_URL unset" };
  try {
    await getDrizzle().execute(sql`select 1 as ok`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "postgres ping failed" };
  }
}

function upsertRows(table: PgTable, rows: Record<string, unknown>[], targetKey = "id") {
  if (!rows.length) return Promise.resolve([]);
  const drizzleDb = getDrizzle();
  return Promise.all(
    rows.map((row) => {
      const keys = Object.keys(row).filter((k) => k !== targetKey);
      const set = Object.fromEntries(keys.map((k) => [k, row[k]]));
      return drizzleDb
        .insert(table)
        .values(row as never)
        .onConflictDoUpdate({
          target: (table as never)[targetKey],
          set: set as never,
        });
    }),
  );
}

export async function persistAtlasDatabase(data: AtlasDatabase): Promise<void> {
  if (!hasPostgres()) return;
  await upsertRows(
    schema.organizations,
    data.organizations.map((o) => ({
      id: o.id,
      ownerId: o.owner_id,
      businessName: o.business_name,
      logoUrl: o.logo_url,
      businessType: o.business_type,
      taxStructure: o.tax_structure,
      state: o.state,
      createdAt: o.created_at,
    })),
  );
  await upsertRows(
    schema.users,
    data.users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      profileImage: u.profile_image,
      timezone: u.timezone,
      preferredLanguage: u.preferred_language,
      emailVerifiedAt: u.email_verified_at,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    })),
  );
  await upsertRows(
    schema.organizationMembers,
    data.organization_members.map((m) => ({
      id: m.id,
      organizationId: m.organization_id,
      userId: m.user_id,
      role: m.role,
      status: m.status,
      joinedAt: m.joined_at,
    })),
  );
  await upsertRows(
    schema.customers,
    data.customers.map((c) => ({
      id: c.id,
      organizationId: c.organization_id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      status: c.status,
      createdAt: c.created_at,
      provenance: c.provenance || "LIVE",
    })),
  );
  await upsertRows(
    schema.tasks,
    data.tasks.map((t) => ({
      id: t.id,
      orgId: t.orgId,
      userId: t.userId,
      title: t.title,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      category: t.category,
      notes: t.notes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  );
  await upsertRows(
    schema.calendarEvents,
    data.calendar_events.map((e) => ({
      id: e.id,
      userId: e.user_id,
      organizationId: e.organization_id,
      title: e.title,
      description: e.description,
      startTime: e.start_time,
      endTime: e.end_time,
      timezone: e.timezone,
      categoryId: e.category_id,
      location: e.location,
      assignee: e.assignee ?? null,
      priority: e.priority,
      reminderTime: e.reminder_time,
      recurringRule: e.recurring_rule,
      externalCalendarId: e.external_calendar_id,
      createdAt: e.created_at,
    })),
  );
  await upsertRows(
    schema.transactions,
    data.transactions.map((t) => ({
      id: t.id,
      orgId: t.orgId,
      userId: t.userId,
      kind: t.kind,
      label: t.label,
      amount: t.amount,
      category: t.category,
      date: t.date,
      receiptName: t.receiptName,
      createdAt: t.createdAt,
    })),
  );
  await upsertRows(
    schema.approvals,
    data.approvals.map((a) => ({
      id: a.id,
      organizationId: a.organization_id,
      requestedBy: a.requested_by,
      actionType: a.action_type,
      payload: a.payload,
      status: a.status,
      createdAt: a.created_at,
      resolvedAt: a.resolved_at,
    })),
  );
  await upsertRows(
    schema.auditLogs,
    data.audit_logs.map((a) => ({
      id: a.id,
      organizationId: a.organization_id,
      actorUserId: a.actor_user_id || "system",
      actorLabel: a.actor_label,
      action: a.action,
      entityType: a.entity_type,
      entityId: a.entity_id,
      createdAt: a.created_at,
    })),
  );
  await upsertRows(
    schema.jobs,
    data.jobs.map((j) => ({
      id: j.id,
      organizationId: j.organization_id,
      kind: j.kind,
      payload: j.payload,
      status: j.status,
      createdAt: j.created_at,
      runAt: j.run_at,
    })),
  );
  await upsertRows(
    schema.agents,
    data.agents.map((a) => ({
      id: a.id,
      organizationId: a.organization_id,
      name: a.name,
      role: a.role,
      status: a.status,
    })),
  );
  await upsertRows(
    schema.notifications,
    data.notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      organizationId: n.organizationId || data.organizations[0]?.id || "org_demo",
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    })),
  );
  await upsertRows(
    schema.quotes,
    data.quotes.map((q) => ({
      id: q.id,
      organizationId: q.organization_id,
      customerId: q.customer_id,
      amount: q.amount,
      status: q.status,
      createdAt: q.created_at,
    })),
  );
  await upsertRows(
    schema.userCredentials,
    data.user_credentials.map((c) => ({
      userId: c.user_id,
      passwordHash: c.password_hash,
      mfaSecret: c.mfa_secret,
      mfaEnabled: c.mfa_enabled,
    })),
    "userId",
  );
  await upsertRows(
    schema.sessions,
    data.sessions.map((s) => ({
      id: s.id,
      token: s.token,
      userId: s.user_id,
      organizationId: s.organization_id,
      createdAt: s.created_at,
      expiresAt: s.expires_at,
      revokedAt: s.revoked_at,
      deviceName: s.device_name,
    })),
  );
  await upsertRows(
    schema.calendarCategories,
    data.calendar_categories.map((c) => ({
      id: c.id,
      userId: c.user_id,
      organizationId: c.organization_id,
      name: c.name,
      color: c.color,
      icon: c.icon,
    })),
  );
  await upsertRows(
    schema.conversations,
    data.conversations.map((c) => ({
      id: c.id,
      userId: c.userId,
      title: c.title,
      preview: c.preview,
      messages: c.messages,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    })),
  );
  await upsertRows(
    schema.memories,
    data.memories.map((m) => ({
      id: m.id,
      userId: m.userId,
      kind: m.kind,
      title: m.title,
      content: m.content,
      approved: m.approved,
      createdAt: m.createdAt,
    })),
  );
  await upsertRows(
    schema.documents,
    data.documents.map((d) => ({
      id: d.id,
      userId: d.userId,
      orgId: d.orgId,
      title: d.title,
      kind: d.kind,
      content: d.content,
      fileName: d.fileName ?? null,
      mimeType: d.mimeType ?? null,
      sizeBytes: d.sizeBytes ?? null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
  );
  await upsertRows(
    schema.subscriptions,
    data.subscriptions.map((s) => ({
      id: s.id,
      orgId: s.orgId,
      plan: s.plan,
      status: s.status,
      renewsAt: s.renewsAt,
      seats: s.seats,
    })),
  );
  await upsertRows(
    schema.automations,
    data.automations.map((a) => ({
      id: a.id,
      organizationId: a.organization_id,
      name: a.name,
      enabled: a.enabled,
      trigger: a.trigger,
      createdAt: a.created_at,
    })),
  );
  await upsertRows(
    schema.autonomyPolicies,
    data.autonomy_policies.map((p) => ({
      organizationId: p.organization_id,
      level: p.level,
      killSwitch: p.kill_switch,
      autoPaymentLimitCents: p.auto_payment_limit_cents,
      refundLimitCents: p.refund_limit_cents,
      discountCapPercent: p.discount_cap_percent,
      marketingBudgetCents: p.marketing_budget_cents,
      earliestScheduleHour: p.earliest_schedule_hour,
      wakeOnlyEmergencies: p.wake_only_emergencies,
      standingOrders: p.standing_orders,
      updatedAt: p.updated_at,
    })),
    "organizationId",
  );
}

async function selectAll<T>(table: PgTable): Promise<T[]> {
  try {
    return (await getDrizzle().select().from(table)) as T[];
  } catch {
    return [];
  }
}

export async function loadAtlasDatabaseFromPostgres(): Promise<AtlasDatabase | null> {
  if (!hasPostgres()) return null;
  const [
    organizations,
    users,
    organizationMembers,
    customers,
    tasks,
    calendarEvents,
    transactions,
    approvals,
    auditLogs,
    jobs,
    agents,
    notifications,
    quotes,
    userCredentials,
    sessions,
    calendarCategories,
    conversations,
    memories,
    documents,
    subscriptions,
    automations,
    autonomyPolicies,
  ] = await Promise.all([
    selectAll<typeof schema.organizations.$inferSelect>(schema.organizations),
    selectAll<typeof schema.users.$inferSelect>(schema.users),
    selectAll<typeof schema.organizationMembers.$inferSelect>(schema.organizationMembers),
    selectAll<typeof schema.customers.$inferSelect>(schema.customers),
    selectAll<typeof schema.tasks.$inferSelect>(schema.tasks),
    selectAll<typeof schema.calendarEvents.$inferSelect>(schema.calendarEvents),
    selectAll<typeof schema.transactions.$inferSelect>(schema.transactions),
    selectAll<typeof schema.approvals.$inferSelect>(schema.approvals),
    selectAll<typeof schema.auditLogs.$inferSelect>(schema.auditLogs),
    selectAll<typeof schema.jobs.$inferSelect>(schema.jobs),
    selectAll<typeof schema.agents.$inferSelect>(schema.agents),
    selectAll<typeof schema.notifications.$inferSelect>(schema.notifications),
    selectAll<typeof schema.quotes.$inferSelect>(schema.quotes),
    selectAll<typeof schema.userCredentials.$inferSelect>(schema.userCredentials),
    selectAll<typeof schema.sessions.$inferSelect>(schema.sessions),
    selectAll<typeof schema.calendarCategories.$inferSelect>(schema.calendarCategories),
    selectAll<typeof schema.conversations.$inferSelect>(schema.conversations),
    selectAll<typeof schema.memories.$inferSelect>(schema.memories),
    selectAll<typeof schema.documents.$inferSelect>(schema.documents),
    selectAll<typeof schema.subscriptions.$inferSelect>(schema.subscriptions),
    selectAll<typeof schema.automations.$inferSelect>(schema.automations),
    selectAll<typeof schema.autonomyPolicies.$inferSelect>(schema.autonomyPolicies),
  ]);

  return {
    organizations: organizations.map((o) => ({
      id: o.id,
      owner_id: o.ownerId,
      business_name: o.businessName,
      logo_url: o.logoUrl,
      business_type: o.businessType,
      tax_structure: o.taxStructure,
      state: o.state,
      created_at: o.createdAt,
    })),
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.fullName,
      profile_image: u.profileImage,
      timezone: u.timezone,
      preferred_language: u.preferredLanguage,
      email_verified_at: u.emailVerifiedAt,
      created_at: u.createdAt,
      updated_at: u.updatedAt,
    })),
    organization_members: organizationMembers.map((m) => ({
      id: m.id,
      organization_id: m.organizationId,
      user_id: m.userId,
      role: m.role as AtlasDatabase["organization_members"][number]["role"],
      status: m.status as AtlasDatabase["organization_members"][number]["status"],
      joined_at: m.joinedAt,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      organization_id: c.organizationId,
      name: c.name,
      email: c.email,
      phone: c.phone,
      status: c.status as AtlasDatabase["customers"][number]["status"],
      created_at: c.createdAt,
      provenance: (c.provenance as AtlasDatabase["customers"][number]["provenance"]) || "LIVE",
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      orgId: t.orgId,
      userId: t.userId,
      title: t.title,
      status: t.status as AtlasDatabase["tasks"][number]["status"],
      priority: t.priority as AtlasDatabase["tasks"][number]["priority"],
      dueDate: t.dueDate,
      category: t.category,
      notes: t.notes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    calendar_events: calendarEvents.map((e) => ({
      id: e.id,
      user_id: e.userId,
      organization_id: e.organizationId,
      title: e.title,
      description: e.description,
      start_time: e.startTime,
      end_time: e.endTime,
      timezone: e.timezone,
      category_id: e.categoryId,
      location: e.location,
      assignee: e.assignee,
      priority: e.priority as AtlasDatabase["calendar_events"][number]["priority"],
      reminder_time: e.reminderTime,
      recurring_rule: e.recurringRule,
      external_calendar_id: e.externalCalendarId,
      created_at: e.createdAt,
    })),
    transactions: transactions.map((t) => ({
      id: t.id,
      orgId: t.orgId,
      userId: t.userId,
      kind: t.kind as AtlasDatabase["transactions"][number]["kind"],
      label: t.label,
      amount: t.amount,
      category: t.category,
      date: t.date,
      receiptName: t.receiptName,
      createdAt: t.createdAt,
    })),
    approvals: approvals.map((a) => ({
      id: a.id,
      organization_id: a.organizationId,
      requested_by: a.requestedBy,
      action_type: a.actionType,
      payload: a.payload,
      status: a.status as AtlasDatabase["approvals"][number]["status"],
      created_at: a.createdAt,
      resolved_at: a.resolvedAt,
    })),
    audit_logs: auditLogs.map((a) => ({
      id: a.id,
      organization_id: a.organizationId,
      actor_user_id: a.actorUserId,
      actor_label: a.actorLabel,
      action: a.action,
      entity_type: a.entityType,
      entity_id: a.entityId,
      created_at: a.createdAt,
    })),
    jobs: jobs.map((j) => ({
      id: j.id,
      organization_id: j.organizationId,
      kind: j.kind,
      payload: j.payload,
      status: j.status as AtlasDatabase["jobs"][number]["status"],
      created_at: j.createdAt,
      run_at: j.runAt,
    })),
    agents: agents.map((a) => ({
      id: a.id,
      organization_id: a.organizationId,
      name: a.name,
      role: a.role,
      status: a.status as AtlasDatabase["agents"][number]["status"],
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      organizationId: n.organizationId,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
    })),
    quotes: quotes.map((q) => ({
      id: q.id,
      organization_id: q.organizationId,
      customer_id: q.customerId,
      amount: q.amount,
      status: q.status as AtlasDatabase["quotes"][number]["status"],
      created_at: q.createdAt,
    })),
    user_credentials: userCredentials.map((c) => ({
      user_id: c.userId,
      password_hash: c.passwordHash,
      mfa_secret: c.mfaSecret,
      mfa_enabled: c.mfaEnabled,
    })),
    sessions: sessions.map((s) => ({
      id: s.id,
      token: s.token,
      user_id: s.userId,
      organization_id: s.organizationId,
      created_at: s.createdAt,
      expires_at: s.expiresAt,
      revoked_at: s.revokedAt,
      device_name: s.deviceName,
    })),
    calendar_categories: calendarCategories.map((c) => ({
      id: c.id,
      user_id: c.userId,
      organization_id: c.organizationId,
      name: c.name,
      color: c.color,
      icon: c.icon,
    })),
    conversations: conversations.map((c) => ({
      id: c.id,
      userId: c.userId,
      title: c.title,
      preview: c.preview,
      messages: c.messages || [],
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    })),
    memories: memories.map((m) => ({
      id: m.id,
      userId: m.userId,
      kind: m.kind as AtlasDatabase["memories"][number]["kind"],
      title: m.title,
      content: m.content,
      approved: m.approved,
      createdAt: m.createdAt,
    })),
    documents: documents.map((d) => ({
      id: d.id,
      userId: d.userId,
      orgId: d.orgId,
      title: d.title,
      kind: d.kind as AtlasDatabase["documents"][number]["kind"],
      content: d.content,
      fileName: d.fileName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      orgId: s.orgId,
      plan: s.plan as AtlasDatabase["subscriptions"][number]["plan"],
      status: s.status as AtlasDatabase["subscriptions"][number]["status"],
      renewsAt: s.renewsAt,
      seats: s.seats,
    })),
    automations: automations.map((a) => ({
      id: a.id,
      organization_id: a.organizationId,
      name: a.name,
      enabled: a.enabled,
      trigger: a.trigger,
      created_at: a.createdAt,
    })),
    autonomy_policies: autonomyPolicies.map((p) => ({
      organization_id: p.organizationId,
      level: p.level as AtlasDatabase["autonomy_policies"][number]["level"],
      kill_switch: p.killSwitch,
      auto_payment_limit_cents: p.autoPaymentLimitCents,
      refund_limit_cents: p.refundLimitCents,
      discount_cap_percent: p.discountCapPercent,
      marketing_budget_cents: p.marketingBudgetCents,
      earliest_schedule_hour: p.earliestScheduleHour,
      wake_only_emergencies: p.wakeOnlyEmergencies,
      standing_orders: p.standingOrders || [],
      updated_at: p.updatedAt,
    })),
    taxRecords: [],
    integrations: [],
    login_attempts: [],
    password_resets: [],
    webhook_receipts: [],
    email_verifications: [],
  };
}
