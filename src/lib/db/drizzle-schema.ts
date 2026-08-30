import { boolean, integer, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

/** Postgres contract. Runtime uses this when DATABASE_URL is set; otherwise `.data/*.json`. */

export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  businessName: text("business_name").notNull(),
  logoUrl: text("logo_url"),
  businessType: text("business_type").notNull().default("service"),
  taxStructure: text("tax_structure").notNull().default("LLC"),
  state: text("state").notNull().default("TX"),
  createdAt: text("created_at").notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  profileImage: text("profile_image"),
  timezone: text("timezone").notNull().default("America/Chicago"),
  preferredLanguage: text("preferred_language").notNull().default("en"),
  emailVerifiedAt: text("email_verified_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    joinedAt: text("joined_at").notNull(),
  },
  (table) => [uniqueIndex("organization_members_org_user").on(table.organizationId, table.userId)],
);

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  status: text("status").notNull().default("lead"),
  createdAt: text("created_at").notNull(),
  provenance: text("provenance").notNull().default("LIVE"),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("normal"),
  dueDate: text("due_date"),
  category: text("category").notNull().default("general"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  organizationId: text("organization_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  timezone: text("timezone").notNull(),
  categoryId: text("category_id").notNull().default("work"),
  location: text("location").notNull().default(""),
  assignee: text("assignee"),
  priority: text("priority").notNull().default("normal"),
  reminderTime: text("reminder_time"),
  recurringRule: text("recurring_rule"),
  externalCalendarId: text("external_calendar_id"),
  createdAt: text("created_at").notNull(),
});

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  amount: integer("amount").notNull(),
  category: text("category"),
  date: text("date").notNull(),
  receiptName: text("receipt_name"),
  createdAt: text("created_at").notNull(),
});

export const approvals = pgTable("approvals", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  requestedBy: text("requested_by").notNull(),
  actionType: text("action_type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
  resolvedAt: text("resolved_at"),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  actorUserId: text("actor_user_id").notNull(),
  actorLabel: text("actor_label").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  createdAt: text("created_at").notNull(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  kind: text("kind").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: text("status").notNull().default("queued"),
  createdAt: text("created_at").notNull(),
  runAt: text("run_at"),
});

export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("active"),
});

export const domainEvents = pgTable("domain_events", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  actorId: text("actor_id"),
  actorLabel: text("actor_label"),
  createdAt: text("created_at").notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  organizationId: text("organization_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const quotes = pgTable("quotes", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  customerId: text("customer_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(),
});

export const DRIZZLE_TABLES = [
  "organizations",
  "users",
  "organization_members",
  "customers",
  "tasks",
  "calendar_events",
  "transactions",
  "approvals",
  "audit_logs",
  "jobs",
  "agents",
  "domain_events",
  "notifications",
  "quotes",
] as const;
