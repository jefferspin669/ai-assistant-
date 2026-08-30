/**
 * PostgreSQL via Drizzle. Dual-write from the file store when DATABASE_URL is set.
 * Reads still come from JSON so existing sync APIs keep working (Backend V1).
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

function upsertRows(table: PgTable, rows: Record<string, unknown>[]) {
  if (!rows.length) return Promise.resolve([]);
  const drizzleDb = getDrizzle();
  return Promise.all(
    rows.map((row) => {
      const keys = Object.keys(row).filter((k) => k !== "id");
      const set = Object.fromEntries(keys.map((k) => [k, row[k]]));
      return drizzleDb
        .insert(table)
        .values(row as never)
        .onConflictDoUpdate({
          target: (table as unknown as { id: typeof schema.customers.id }).id,
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
}
