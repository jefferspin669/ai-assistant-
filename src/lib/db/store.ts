import { computeTaxEstimate, loadTaxTransactions } from "@/lib/tax-ledger";
import { loadTasks } from "@/lib/tasks";
import { loadCalendarState } from "@/lib/smart-calendar";
import type {
  AtlasDatabase,
  DbConversation,
  DbDocument,
  DbEvent,
  DbMemory,
  DbNotification,
  DbOrganization,
  DbSubscription,
  DbTask,
  DbTaxRecord,
  DbTransaction,
  DbUser,
  DbUserCredential,
} from "@/lib/db/schema";

const DB_KEY = "atlas-database-v2";
const LEGACY_DB_KEY = "atlas-database-v1";

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
    events: [],
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
    ownerUserId: userId,
    name: "Atlas Demo Co",
    industry: "HVAC",
    createdAt: stamp,
  };

  const calendar = typeof window !== "undefined" ? loadCalendarState() : null;
  const events: DbEvent[] = (calendar?.events || []).slice(0, 12).map((event) => ({
    id: event.id,
    orgId,
    userId,
    title: event.title,
    categoryId: event.categoryId,
    color: calendar?.categories.find((c) => c.id === event.categoryId)?.color || "#2f8f8a",
    start: event.start,
    end: event.end,
    notes: event.notes,
  }));

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
    users: [user],
    user_credentials: [credential],
    organizations: [org],
    events,
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
    const raw = localStorage.getItem(DB_KEY) || localStorage.getItem(LEGACY_DB_KEY);
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
    const state: AtlasDatabase = {
      ...emptyDb(),
      ...parsed,
      users,
      user_credentials:
        parsed.user_credentials?.length ? parsed.user_credentials : legacyCredentials,
      organizations: parsed.organizations || [],
      events: parsed.events || [],
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
    Events: db.events.length,
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
