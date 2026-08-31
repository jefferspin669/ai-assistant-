/** Atlas Database schema — mirrors the product architecture tree.
 * Column-shaped records for the JSON adapter. Postgres lives in `drizzle-schema.ts`;
 * public types live in `lib/domain/types.ts`. Do not fork a third Customer type here.
 */

/** `users` table */
export type DbUser = {
  id: string;
  email: string;
  full_name: string;
  profile_image: string | null;
  timezone: string;
  preferred_language: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Auth secrets — not part of the public `users` row. */
export type DbUserCredential = {
  user_id: string;
  password_hash: string;
  mfa_secret: string | null;
  mfa_enabled: boolean;
};

/** `organizations` table */
export type DbOrganization = {
  id: string;
  owner_id: string;
  business_name: string;
  logo_url: string | null;
  business_type: string;
  tax_structure: string;
  state: string;
  created_at: string;
};

export type OrgMemberRole = "owner" | "admin" | "manager" | "employee" | "accountant" | "viewer";
export type OrgMemberStatus = "active" | "invited" | "suspended" | "removed";

/** `organization_members` table */
export type DbOrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgMemberRole;
  status: OrgMemberStatus;
  joined_at: string;
};

export type EventPriority = "low" | "normal" | "high";

/** `calendar_categories` table */
export type DbCalendarCategory = {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  color: string;
  icon: string;
};

/** `calendar_events` table */
export type DbCalendarEvent = {
  id: string;
  user_id: string;
  organization_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  timezone: string;
  category_id: string;
  location: string;
  assignee?: string | null;
  priority: EventPriority;
  reminder_time: string | null;
  recurring_rule: string | null;
  external_calendar_id: string | null;
  created_at: string;
};

/** @deprecated Use DbCalendarEvent */
export type DbEvent = DbCalendarEvent;

export type DbTask = {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  status: "todo" | "doing" | "done" | "in_progress" | "blocked" | "completed";
  priority: "low" | "normal" | "high";
  dueDate: string | null;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type DbCustomer = {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: "lead" | "active" | "inactive";
  created_at: string;
  provenance?: "DEMO" | "LIVE" | "CONNECTED DATA";
};

export type DbAgent = {
  id: string;
  organization_id: string;
  name: string;
  role: string;
  status: "active" | "paused";
};

export type DbAutomation = {
  id: string;
  organization_id: string;
  name: string;
  enabled: boolean;
  trigger: string;
  created_at: string;
};

export type DbTransaction = {
  id: string;
  orgId: string;
  userId: string;
  kind: "income" | "expense";
  label: string;
  amount: number;
  category: string | null;
  date: string;
  receiptName: string | null;
  createdAt: string;
};

export type DbTaxRecord = {
  id: string;
  orgId: string;
  userId: string;
  year: number;
  grossIncome: number;
  expenses: number;
  estimatedTax: number;
  status: "draft" | "estimated" | "filed";
  updatedAt: string;
};

export type DbConversation = {
  id: string;
  userId: string;
  title: string;
  preview: string;
  messages: { role: "user" | "ai"; text: string; at: string }[];
  updatedAt: string;
  createdAt: string;
};

export type DbMemory = {
  id: string;
  userId: string;
  kind: "preference" | "prompt" | "person" | "project" | "long-term";
  title: string;
  content: string;
  approved: boolean;
  createdAt: string;
};

export type DbDocument = {
  id: string;
  userId: string;
  orgId: string;
  title: string;
  kind: "file" | "document" | "conversation" | "template";
  content: string;
  fileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type DbSubscription = {
  id: string;
  orgId: string;
  plan: "free" | "pro" | "business" | "enterprise";
  status: "active" | "trialing" | "past_due" | "canceled";
  renewsAt: string;
  seats: number;
};

export type DbNotification = {
  id: string;
  userId: string;
  organizationId?: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export type DbSession = {
  id: string;
  token: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  device_name: string;
};

export type DbAuditLog = {
  id: string;
  organization_id: string;
  actor_user_id: string | null;
  actor_label: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

export type DbApproval = {
  id: string;
  organization_id: string;
  requested_by: string;
  action_type: string;
  payload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  resolved_at: string | null;
};

export type DbJob = {
  id: string;
  organization_id: string;
  kind: string;
  payload: Record<string, unknown>;
  status: "queued" | "running" | "done" | "failed";
  created_at: string;
  run_at: string | null;
};

export type DbIntegration = {
  id: string;
  organization_id: string;
  provider: string;
  status: "connected" | "expired" | "error" | "disconnected";
  account_label: string | null;
  last_error: string | null;
  updated_at: string;
};

export type DbLoginAttempt = {
  id: string;
  email: string;
  success: boolean;
  at: string;
  ip: string;
};

export type DbPasswordReset = {
  token: string;
  user_id: string;
  expires_at: string;
  used_at: string | null;
};

export type DbQuote = {
  id: string;
  organization_id: string;
  customer_id: string;
  amount: number;
  status: "draft" | "sent" | "accepted";
  created_at: string;
};

export type DbWebhookReceipt = {
  id: string;
  organization_id: string;
  received_at: string;
};

export type DbEmailVerification = {
  token: string;
  user_id: string;
  expires_at: string;
  used_at: string | null;
};

export type DbAutonomyPolicy = {
  organization_id: string;
  level: 1 | 2 | 3 | 4;
  kill_switch: boolean;
  auto_payment_limit_cents: number;
  refund_limit_cents: number;
  discount_cap_percent: number;
  marketing_budget_cents: number;
  earliest_schedule_hour: number;
  wake_only_emergencies: boolean;
  standing_orders: string[];
  updated_at: string;
};

export type AtlasDatabase = {
  users: DbUser[];
  user_credentials: DbUserCredential[];
  organizations: DbOrganization[];
  organization_members: DbOrganizationMember[];
  calendar_categories: DbCalendarCategory[];
  calendar_events: DbCalendarEvent[];
  tasks: DbTask[];
  customers: DbCustomer[];
  transactions: DbTransaction[];
  taxRecords: DbTaxRecord[];
  conversations: DbConversation[];
  memories: DbMemory[];
  documents: DbDocument[];
  subscriptions: DbSubscription[];
  notifications: DbNotification[];
  agents: DbAgent[];
  automations: DbAutomation[];
  sessions: DbSession[];
  audit_logs: DbAuditLog[];
  approvals: DbApproval[];
  jobs: DbJob[];
  integrations: DbIntegration[];
  login_attempts: DbLoginAttempt[];
  password_resets: DbPasswordReset[];
  quotes: DbQuote[];
  webhook_receipts: DbWebhookReceipt[];
  email_verifications: DbEmailVerification[];
  autonomy_policies: DbAutonomyPolicy[];
};

export const DB_TABLES = [
  "Users",
  "Organizations",
  "Organization Members",
  "Calendar Categories",
  "Calendar Events",
  "Customers",
  "Tasks",
  "Transactions",
  "Tax Records",
  "Conversations",
  "Memories",
  "Documents",
  "Subscriptions",
  "Agents",
  "Automations",
  "Sessions",
  "Audit Logs",
  "Approvals",
  "Jobs",
  "Integrations",
  "Quotes",
  "Webhook Receipts",
  "Autonomy Policies",
] as const;
