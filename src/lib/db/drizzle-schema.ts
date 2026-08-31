import { boolean, integer, jsonb, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";

/** Postgres contract. Runtime uses this when DATABASE_URL is set; otherwise `.data/*.json`.
 * Infer domain types from this schema where possible; keep `lib/domain/types.ts` as the public API.
 */

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

export const userCredentials = pgTable("user_credentials", {
  userId: text("user_id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  mfaSecret: text("mfa_secret"),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  token: text("token").notNull(),
  userId: text("user_id").notNull(),
  organizationId: text("organization_id").notNull(),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(),
  revokedAt: text("revoked_at"),
  deviceName: text("device_name").notNull().default("web"),
});

export const calendarCategories = pgTable("calendar_categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  icon: text("icon").notNull(),
});

export const conversations = pgTable("conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  preview: text("preview").notNull(),
  messages: jsonb("messages").$type<{ role: "user" | "ai"; text: string; at: string }[]>().notNull(),
  updatedAt: text("updated_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const memories = pgTable("memories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  orgId: text("org_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  content: text("content").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  renewsAt: text("renews_at").notNull(),
  seats: integer("seats").notNull().default(1),
});

export const automations = pgTable("automations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull(),
  name: text("name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  trigger: text("trigger").notNull(),
  createdAt: text("created_at").notNull(),
});

export const autonomyPolicies = pgTable("autonomy_policies", {
  organizationId: text("organization_id").primaryKey(),
  level: integer("level").notNull().default(1),
  killSwitch: boolean("kill_switch").notNull().default(false),
  autoPaymentLimitCents: integer("auto_payment_limit_cents").notNull(),
  refundLimitCents: integer("refund_limit_cents").notNull(),
  discountCapPercent: integer("discount_cap_percent").notNull(),
  marketingBudgetCents: integer("marketing_budget_cents").notNull(),
  earliestScheduleHour: integer("earliest_schedule_hour").notNull(),
  wakeOnlyEmergencies: boolean("wake_only_emergencies").notNull().default(true),
  standingOrders: jsonb("standing_orders").$type<string[]>().notNull(),
  updatedAt: text("updated_at").notNull(),
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
  "user_credentials",
  "sessions",
  "calendar_categories",
  "conversations",
  "memories",
  "documents",
  "subscriptions",
  "automations",
  "autonomy_policies",
] as const;
