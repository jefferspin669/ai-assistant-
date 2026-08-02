import { computeTaxEstimate, loadTaxTransactions } from "@/lib/tax-ledger";
import { loadTasks } from "@/lib/tasks";
import { loadCalendarState } from "@/lib/smart-calendar";
import type {
  AtlasDatabase,
  DbConversation,
  DbDocument,
  DbCalendarEvent,
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

const DB_KEY = "atlas-database-v4";
const LEGACY_DB_KEYS = ["atlas-database-v3", "atlas-database-v2", "atlas-database-v1"];

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
    calendar_events: [],
    tasks: [],
    transactions: [],
    taxRecords: [],
    conversations: [],
    memories: [],
    documents: [],
    subscriptions: [],
    notifications: [],
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
    created_at: stamp,
    updated_at: stamp,
  };

  const credential: DbUserCredential = {
    user_id: userId,
    password_hash: "v1$seed$demo", // demo placeholder — signup/login write real hashes
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
  const calendar_events: DbCalendarEvent[] = (calendar?.events || []).slice(0, 12).map((event) => {
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

  const transactions: DbTransaction[] = loadTaxTransactions().map((row) => ({
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
  }));

  const estimate = computeTaxEstimate(
    transactions.map((t) => ({
      id: t.id,
      kind: t.kind,
      label: t.label,
      amount: t.amount,
      category: t.category,
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
      plan: "pro",
      status: "active",
      renewsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 28).toISOString(),
      seats: 5,
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
    calendar_events,
    tasks,
    transactions,
    taxRecords,
    conversations,
    memories,
    documents,
    subscriptions,
    notifications,
  };
}

export function loadDatabase(): AtlasDatabase {
  if (typeof window === "undefined") return seedDatabase();
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
        user_id: org.owner_id || users[0].id,
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
    const state: AtlasDatabase = {
      ...emptyDb(),
      ...parsed,
      users,
      user_credentials:
        parsed.user_credentials?.length ? parsed.user_credentials : legacyCredentials,
      organizations,
      organization_members,
      calendar_events,
      tasks: parsed.tasks || [],
      transactions: parsed.transactions || [],
      taxRecords: parsed.taxRecords || [],
      conversations: parsed.conversations || [],
      memories: parsed.memories || [],
      documents: parsed.documents || [],
      subscriptions: parsed.subscriptions || [],
      notifications: parsed.notifications || [],
    };
    localStorage.setItem(DB_KEY, JSON.stringify(state));
    return state;
  } catch {
    return seedDatabase();
  }
}

export function saveDatabase(db: AtlasDatabase) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DB_KEY, JSON.stringify(db));
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
    "Calendar Events": db.calendar_events.length,
    Tasks: db.tasks.length,
    Transactions: db.transactions.length,
    "Tax Records": db.taxRecords.length,
    Conversations: db.conversations.length,
    Memories: db.memories.length,
    Documents: db.documents.length,
    Subscriptions: db.subscriptions.length,
  };
}

export { newId, nowIso };
