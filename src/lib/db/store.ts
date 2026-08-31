import { jsonMirrorEnabled, postgresLive } from "@/lib/db/driver";
import { hashPassword } from "@/lib/secure-store";
import { computeTaxEstimate, loadTaxTransactions } from "@/lib/tax-ledger";
import { loadTasks } from "@/lib/tasks";
import { loadCalendarState } from "@/lib/smart-calendar";
import { fileExists, readJsonFile, writeJsonFile } from "@/lib/db/file-persist";
import type {
  AtlasDatabase,
  DbConversation,
  DbDocument,
  DbCalendarCategory,
  DbCalendarEvent,
  DbCustomer,
  DbMemory,
  DbNotification,
  DbOrganization,
  DbOrganizationMember,
  DbSubscription,
  DbTask,
  DbTaxRecord,
  DbTransaction,
  DbUser,
  DbUserCredential,
} from "@/lib/db/schema";

const DB_KEY = "atlas-database-v5";
const DB_FILE = "atlas-db.json";
const LEGACY_DB_KEYS = [
  "atlas-database-v4",
  "atlas-database-v3",
  "atlas-database-v2",
  "atlas-database-v1",
];

/** Process-local DB for Next.js API routes (shared across route modules). */
type AtlasGlobal = typeof globalThis & { __atlasServerDb?: AtlasDatabase };

function getServerDb() {
  const g = globalThis as AtlasGlobal;
  if (g.__atlasServerDb) {
    return g.__atlasServerDb;
  }
  if (postgresLive()) {
    // Real adapter: wait for ensureServerDatabase() to hydrate. Do not seed JSON.
    g.__atlasServerDb = emptyDb();
    return g.__atlasServerDb;
  }
  const fromDisk = readJsonFile<AtlasDatabase>(DB_FILE);
  if (fromDisk) {
    g.__atlasServerDb = hydrateDatabase(fromDisk);
  } else {
    g.__atlasServerDb = seedDatabase();
    writeJsonFile(DB_FILE, g.__atlasServerDb);
  }
  return g.__atlasServerDb;
}

export function applyServerDatabase(db: AtlasDatabase) {
  setServerDb(hydrateDatabase(db));
}

function setServerDb(db: AtlasDatabase) {
  (globalThis as AtlasGlobal).__atlasServerDb = db;
}

const CATEGORY_ICONS: Record<string, string> = {
  meetings: "users",
  personal: "user",
  work: "briefcase",
  deadlines: "flag",
  bills: "receipt",
  taxes: "landmark",
  "high-priority": "alert",
  family: "home",
  school: "book",
  travel: "map",
  fitness: "activity",
};

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function emptyDb(): AtlasDatabase {
  return {
    users: [],
    user_credentials: [],
    organizations: [],
    organization_members: [],
    calendar_categories: [],
    calendar_events: [],
    tasks: [],
    customers: [],
    transactions: [],
    taxRecords: [],
    conversations: [],
    memories: [],
    documents: [],
    subscriptions: [],
    notifications: [],
    agents: [],
    automations: [],
    sessions: [],
    audit_logs: [],
    approvals: [],
    jobs: [],
    integrations: [],
    login_attempts: [],
    password_resets: [],
    quotes: [],
    webhook_receipts: [],
    email_verifications: [],
    autonomy_policies: [],
  };
}

function hydrateDatabase(raw: Partial<AtlasDatabase>): AtlasDatabase {
  const base = emptyDb();
  return {
    ...base,
    ...raw,
    users: (raw.users || []).map((user) => normalizeUser(user)),
    user_credentials: (raw.user_credentials || []).map((row) => ({
      user_id: row.user_id,
      password_hash: row.password_hash,
      mfa_secret: row.mfa_secret ?? null,
      mfa_enabled: Boolean(row.mfa_enabled),
    })),
    sessions: raw.sessions || [],
    audit_logs: raw.audit_logs || [],
    approvals: raw.approvals || [],
    jobs: raw.jobs || [],
    integrations: raw.integrations || [],
    login_attempts: raw.login_attempts || [],
    password_resets: raw.password_resets || [],
    quotes: raw.quotes || [],
    webhook_receipts: raw.webhook_receipts || [],
    email_verifications: raw.email_verifications || [],
    autonomy_policies: raw.autonomy_policies || [],
    notifications: raw.notifications || [],
    agents: raw.agents || [],
    automations: raw.automations || [],
    customers: raw.customers || [],
    tasks: raw.tasks || [],
    transactions: raw.transactions || [],
  };
}

function normalizeUser(raw: Partial<DbUser> & { name?: string; createdAt?: string; updatedAt?: string }): DbUser {
  const stamp = nowIso();
  return {
    id: raw.id || newId("user"),
    email: raw.email || "demo@atlas.ai",
    full_name: raw.full_name || raw.name || "Atlas User",
    profile_image: raw.profile_image ?? null,
    timezone: raw.timezone || "America/Chicago",
    preferred_language: raw.preferred_language || "en",
    email_verified_at: raw.email_verified_at ?? null,
    created_at: raw.created_at || raw.createdAt || stamp,
    updated_at: raw.updated_at || raw.updatedAt || stamp,
  };
}

function normalizeOrganization(
  raw: Partial<DbOrganization> & {
    ownerUserId?: string;
    name?: string;
    industry?: string;
    createdAt?: string;
  },
): DbOrganization {
  return {
    id: raw.id || newId("org"),
    owner_id: raw.owner_id || raw.ownerUserId || "",
    business_name: raw.business_name || raw.name || "My Business",
    logo_url: raw.logo_url ?? null,
    business_type: raw.business_type || raw.industry || "General",
    tax_structure: raw.tax_structure || "Sole proprietor",
    state: raw.state || "TX",
    created_at: raw.created_at || raw.createdAt || nowIso(),
  };
}

function normalizeCalendarEvent(
  raw: Partial<DbCalendarEvent> & {
    orgId?: string;
    userId?: string;
    categoryId?: string;
    start?: string;
    end?: string;
    notes?: string;
    createdAt?: string;
  },
  fallbacks: { userId: string; orgId: string },
): DbCalendarEvent {
  const start = raw.start_time || raw.start || nowIso();
  const end =
    raw.end_time ||
    raw.end ||
    new Date(new Date(start).getTime() + 60 * 60000).toISOString();
  return {
    id: raw.id || newId("evt"),
    user_id: raw.user_id || raw.userId || fallbacks.userId,
    organization_id: raw.organization_id || raw.orgId || fallbacks.orgId,
    title: raw.title || "Untitled event",
    description: raw.description || raw.notes || "",
    start_time: start,
    end_time: end,
    timezone: raw.timezone || "America/Chicago",
    category_id: raw.category_id || raw.categoryId || "work",
    location: raw.location || "",
    priority: raw.priority || "normal",
    reminder_time: raw.reminder_time ?? null,
    recurring_rule: raw.recurring_rule ?? null,
    external_calendar_id: raw.external_calendar_id ?? null,
    created_at: raw.created_at || raw.createdAt || start,
  };
}

/** Seed a demo workspace so the architecture map and APIs have data. */
export function seedDatabase(): AtlasDatabase {
  const userId = newId("user");
  const orgId = newId("org");
  const stamp = nowIso();

  const user: DbUser = {
    id: userId,
    email: "demo@atlas.ai",
    full_name: "Atlas Demo",
    profile_image: null,
    timezone: "America/Chicago",
    preferred_language: "en",
    email_verified_at: stamp,
    created_at: stamp,
    updated_at: stamp,
  };

  const credential: DbUserCredential = {
    user_id: userId,
    password_hash: hashPassword("atlas-demo", "seedatlasdemo12"),
    mfa_secret: null,
    mfa_enabled: false,
  };

  const org: DbOrganization = {
    id: orgId,
    owner_id: userId,
    business_name: "Atlas Demo Co",
    logo_url: null,
    business_type: "HVAC",
    tax_structure: "LLC",
    state: "TX",
    created_at: stamp,
  };

  const memberUserId = newId("user");
  const invitedUserId = newId("user");
  const teammate: DbUser = {
    id: memberUserId,
    email: "alex@atlas.ai",
    full_name: "Alex Rivera",
    profile_image: null,
    timezone: "America/Chicago",
    preferred_language: "en",
    email_verified_at: stamp,
    created_at: stamp,
    updated_at: stamp,
  };
  const invited: DbUser = {
    id: invitedUserId,
    email: "sam@atlas.ai",
    full_name: "Sam Patel",
    profile_image: null,
    timezone: "America/Chicago",
    preferred_language: "en",
    email_verified_at: null,
    created_at: stamp,
    updated_at: stamp,
  };

  const organization_members: DbOrganizationMember[] = [
    {
      id: newId("om"),
      organization_id: orgId,
      user_id: userId,
      role: "owner",
      status: "active",
      joined_at: stamp,
    },
    {
      id: newId("om"),
      organization_id: orgId,
      user_id: memberUserId,
      role: "manager",
      status: "active",
      joined_at: stamp,
    },
    {
      id: newId("om"),
      organization_id: orgId,
      user_id: invitedUserId,
      role: "employee",
      status: "invited",
      joined_at: stamp,
    },
  ];

  const calendar = typeof window !== "undefined" ? loadCalendarState() : null;
  const sourceCategories =
    calendar?.categories?.length
      ? calendar.categories
      : [
          { id: "meetings", label: "Meetings", color: "#3b82f6" },
          { id: "personal", label: "Personal", color: "#22c55e" },
          { id: "work", label: "Work", color: "#eab308" },
          { id: "deadlines", label: "Deadlines", color: "#ef4444" },
          { id: "bills", label: "Bills", color: "#a855f7" },
          { id: "family", label: "Family", color: "#fb7185" },
        ];
  const calendar_categories: DbCalendarCategory[] = sourceCategories.map((category) => ({
    id: category.id,
    user_id: userId,
    organization_id: orgId,
    name: category.label,
    color: category.color,
    icon: CATEGORY_ICONS[category.id] || "tag",
  }));

  let calendar_events: DbCalendarEvent[] = (calendar?.events || []).slice(0, 12).map((event) => {
    const startMs = new Date(event.start).getTime();
    const reminder = new Date(startMs - 30 * 60000).toISOString();
    return {
      id: event.id,
      user_id: userId,
      organization_id: orgId,
      title: event.title,
      description: event.notes || "",
      start_time: event.start,
      end_time: event.end,
      timezone: "America/Chicago",
      category_id: event.categoryId,
      location: event.location || "",
      priority: event.priority || "normal",
      reminder_time: reminder,
      recurring_rule: null,
      external_calendar_id: null,
      created_at: stamp,
    };
  });
  if (!calendar_events.length) {
    const start = new Date();
    start.setHours(14, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    calendar_events = [
      {
        id: newId("evt"),
        user_id: userId,
        organization_id: orgId,
        title: "Johnson Construction consult",
        description: "Estimate follow-up",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        timezone: "America/Chicago",
        category_id: "work",
        location: "",
        assignee: null,
        priority: "normal",
        reminder_time: null,
        recurring_rule: null,
        external_calendar_id: null,
        created_at: stamp,
      },
    ];
  }

  const tasks: DbTask[] = loadTasks().map((task) => ({
    id: task.id,
    orgId,
    userId,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    category: task.category,
    notes: task.notes,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));

  const transactions: DbTransaction[] = [
    ...loadTaxTransactions().map((row) => ({
      id: row.id,
      orgId,
      userId,
      kind: row.kind,
      label: row.label,
      amount: row.amount,
      category: row.category,
      date: row.date,
      receiptName: row.receiptName,
      createdAt: row.createdAt,
    })),
    {
      id: newId("txn"),
      orgId,
      userId,
      kind: "income" as const,
      label: "Invoice · Johnson Construction (overdue)",
      amount: 4280,
      category: "invoice",
      date: new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10),
      receiptName: null,
      createdAt: stamp,
    },
  ];

  const estimate = computeTaxEstimate(
    transactions.map((t) => ({
      id: t.id,
      kind: t.kind,
      label: t.label,
      amount: t.amount,
      category: t.category || "",
      date: t.date,
      notes: "",
      receiptName: t.receiptName,
      createdAt: t.createdAt,
    })),
  );

  const taxRecords: DbTaxRecord[] = [
    {
      id: newId("tax"),
      orgId,
      userId,
      year: new Date().getFullYear(),
      grossIncome: estimate.grossIncome,
      expenses: estimate.expenses,
      estimatedTax: estimate.totalEstimated,
      status: "estimated",
      updatedAt: stamp,
    },
  ];

  const conversations: DbConversation[] = [
    {
      id: newId("chat"),
      userId,
      title: "Morning check-in",
      preview: "How is business?",
      messages: [
        { role: "user", text: "How is business?", at: stamp },
        { role: "ai", text: "Revenue is steady. Two estimates need approval.", at: stamp },
      ],
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];

  const memories: DbMemory[] = [
    {
      id: newId("mem"),
      userId,
      kind: "preference",
      title: "Morning summaries",
      content: "Prefer short morning summaries with dollars first.",
      approved: true,
      createdAt: stamp,
    },
  ];

  const documents: DbDocument[] = [
    {
      id: newId("doc"),
      userId,
      orgId,
      title: "Q2 receipts.zip",
      kind: "file",
      content: "Demo vault file placeholder",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];

  const subscriptions: DbSubscription[] = [
    {
      id: newId("sub"),
      orgId,
      plan: "business",
      status: "active",
      renewsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString(),
      seats: 5,
    },
  ];

  const customers: DbCustomer[] = [
    {
      id: newId("cust"),
      organization_id: orgId,
      name: "Jamie Cole",
      email: "jamie@email.com",
      phone: "(555) 882-1100",
      status: "active",
      created_at: stamp,
      provenance: "DEMO",
    },
    {
      id: newId("cust"),
      organization_id: orgId,
      name: "Marcus Nguyen",
      email: "marcus@email.com",
      phone: "(555) 204-1182",
      status: "lead",
      created_at: stamp,
      provenance: "DEMO",
    },
    {
      id: newId("cust"),
      organization_id: orgId,
      name: "Johnson Construction",
      email: "ap@johnsonconstruction.example",
      phone: "(555) 441-2200",
      status: "active",
      created_at: stamp,
      provenance: "DEMO",
    },
  ];

  const notifications: DbNotification[] = [
    {
      id: newId("note"),
      userId,
      title: "Tax estimate ready",
      body: `Estimated tax ${estimate.totalEstimated.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} from your ledger.`,
      read: false,
      createdAt: stamp,
    },
  ];

  return {
    users: [user, teammate, invited],
    user_credentials: [credential],
    organizations: [org],
    organization_members,
    calendar_categories,
    calendar_events,
    tasks,
    customers,
    transactions,
    taxRecords,
    conversations,
    memories,
    documents,
    subscriptions,
    notifications,
    agents: [
      {
        id: newId("agent"),
        organization_id: orgId,
        name: "Atlas",
        role: "Owner cockpit",
        status: "active",
      },
      {
        id: newId("agent"),
        organization_id: orgId,
        name: "Receptionist",
        role: "Front desk",
        status: "active",
      },
    ],
    automations: [
      {
        id: newId("auto"),
        organization_id: orgId,
        name: "Missed-call follow-up",
        enabled: false,
        trigger: "missed_call",
        created_at: stamp,
      },
    ],
    sessions: [],
    audit_logs: [],
    approvals: [],
    jobs: [],
    autonomy_policies: [
      {
        organization_id: orgId,
        level: 1,
        kill_switch: false,
        auto_payment_limit_cents: 500_000,
        refund_limit_cents: 10_000,
        discount_cap_percent: 10,
        marketing_budget_cents: 150_000,
        earliest_schedule_hour: 8,
        wake_only_emergencies: true,
        standing_orders: [
          "Never discount more than 10% without approval.",
          "Do not schedule before 8:00 AM without approval.",
          "Wake the owner only for true emergencies.",
        ],
        updated_at: stamp,
      },
    ],
    integrations: [
      {
        id: "gmail",
        organization_id: orgId,
        provider: "gmail",
        status: "disconnected",
        account_label: null,
        last_error: null,
        updated_at: stamp,
      },
      {
        id: "google-calendar",
        organization_id: orgId,
        provider: "google-calendar",
        status: "disconnected",
        account_label: null,
        last_error: null,
        updated_at: stamp,
      },
      {
        id: "stripe",
        organization_id: orgId,
        provider: "stripe",
        status: "disconnected",
        account_label: null,
        last_error: null,
        updated_at: stamp,
      },
    ],
    login_attempts: [],
    password_resets: [],
    quotes: [],
    webhook_receipts: [],
    email_verifications: [],
  };
}

export function loadDatabase(): AtlasDatabase {
  if (typeof window === "undefined") {
    return hydrateDatabase(getServerDb());
  }
  try {
    let raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      for (const key of LEGACY_DB_KEYS) {
        raw = localStorage.getItem(key);
        if (raw) break;
      }
    }
    if (!raw) {
      const seeded = seedDatabase();
      localStorage.setItem(DB_KEY, JSON.stringify(seeded));
      return seeded;
    }
    type LegacyUser = Partial<DbUser> & {
      name?: string;
      passwordHash?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    const parsed = JSON.parse(raw) as Omit<Partial<AtlasDatabase>, "users"> & {
      users?: LegacyUser[];
    };
    const legacyUsers = parsed.users || [];
    const users = legacyUsers.map((user) => normalizeUser(user));
    const legacyCredentials: DbUserCredential[] = legacyUsers
      .filter((user): user is LegacyUser & { id: string; passwordHash: string } =>
        Boolean(user.id && user.passwordHash),
      )
      .map((user) => ({
        user_id: user.id,
        password_hash: user.passwordHash,
        mfa_secret: null,
        mfa_enabled: false,
      }));
    type LegacyOrg = Partial<DbOrganization> & {
      ownerUserId?: string;
      name?: string;
      industry?: string;
      createdAt?: string;
    };
    const organizations = ((parsed.organizations || []) as LegacyOrg[]).map((org) =>
      normalizeOrganization(org),
    );
    let organization_members = parsed.organization_members || [];
    if (!organization_members.length && organizations.length && users.length) {
      organization_members = organizations.map((org) => ({
        id: newId("om"),
        organization_id: org.id,
        user_id: org.owner_id || users[0]?.id || "",
        role: "owner" as const,
        status: "active" as const,
        joined_at: org.created_at,
      }));
    }
    type LegacyEvent = Partial<DbCalendarEvent> & {
      orgId?: string;
      userId?: string;
      categoryId?: string;
      start?: string;
      end?: string;
      notes?: string;
      createdAt?: string;
    };
    const legacyEvents = ((parsed as { events?: LegacyEvent[] }).events ||
      parsed.calendar_events ||
      []) as LegacyEvent[];
    const fallbacks = {
      userId: users[0]?.id || "",
      orgId: organizations[0]?.id || "",
    };
    const calendar_events = legacyEvents.map((event) => normalizeCalendarEvent(event, fallbacks));
    let calendar_categories = parsed.calendar_categories || [];
    if (!calendar_categories.length && users.length && organizations.length) {
      const ids = Array.from(new Set(calendar_events.map((e) => e.category_id).filter(Boolean)));
      calendar_categories = (ids.length ? ids : ["work", "meetings", "personal"]).map((id) => ({
        id,
        user_id: fallbacks.userId,
        organization_id: fallbacks.orgId,
        name: id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        color: "#2f8f8a",
        icon: CATEGORY_ICONS[id] || "tag",
      }));
    }
    const state: AtlasDatabase = {
      ...emptyDb(),
      ...parsed,
      users,
      user_credentials:
        parsed.user_credentials?.length ? parsed.user_credentials : legacyCredentials,
      organizations,
      organization_members,
      calendar_categories,
      calendar_events,
      tasks: parsed.tasks || [],
      customers: parsed.customers || [],
      transactions: parsed.transactions || [],
      taxRecords: parsed.taxRecords || [],
      conversations: parsed.conversations || [],
      memories: parsed.memories || [],
      documents: parsed.documents || [],
      subscriptions: parsed.subscriptions || [],
      notifications: parsed.notifications || [],
      agents: parsed.agents || [],
      automations: parsed.automations || [],
      sessions: parsed.sessions || [],
      audit_logs: parsed.audit_logs || [],
      approvals: parsed.approvals || [],
      jobs: parsed.jobs || [],
      integrations: parsed.integrations || [],
      login_attempts: parsed.login_attempts || [],
      password_resets: parsed.password_resets || [],
      quotes: parsed.quotes || [],
      webhook_receipts: parsed.webhook_receipts || [],
      email_verifications: parsed.email_verifications || [],
    };
    localStorage.setItem(DB_KEY, JSON.stringify(state));
    return state;
  } catch {
    return seedDatabase();
  }
}

export function saveDatabase(db: AtlasDatabase) {
  const next = hydrateDatabase(db);
  if (typeof window === "undefined") {
    setServerDb(next);
    if (jsonMirrorEnabled()) {
      writeJsonFile(DB_FILE, next);
    }
    if (postgresLive()) {
      void import("@/lib/db/postgres")
        .then((mod) => mod.persistAtlasDatabase(next))
        .catch((error) => {
          console.error("[atlas:pg]", error instanceof Error ? error.message : error);
        });
    }
    return;
  }
  localStorage.setItem(DB_KEY, JSON.stringify(next));
}

export function resetDatabase() {
  const seeded = seedDatabase();
  saveDatabase(seeded);
  return seeded;
}

export function databaseStats(db: AtlasDatabase) {
  return {
    Users: db.users.length,
    Organizations: db.organizations.length,
    "Organization Members": db.organization_members.length,
    "Calendar Categories": db.calendar_categories.length,
    "Calendar Events": db.calendar_events.length,
    Customers: db.customers.length,
    Tasks: db.tasks.length,
    Transactions: db.transactions.length,
    "Tax Records": db.taxRecords.length,
    Conversations: db.conversations.length,
    Memories: db.memories.length,
    Documents: db.documents.length,
    Subscriptions: db.subscriptions.length,
  };
}

export function serverPersistenceInfo() {
  return {
    driver: postgresLive() ? "postgres" : "json",
    file: DB_FILE,
    present: typeof window === "undefined" ? fileExists(DB_FILE) : false,
    jsonMirror: jsonMirrorEnabled(),
  };
}

export { newId, nowIso };
