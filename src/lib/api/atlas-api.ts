/**
 * Atlas Backend API (client-side mock).
 * Domains: Authentication, Users, Businesses, Calendar, Tasks,
 * Transactions, Taxes, AI, Notifications, Files, Billing.
 */
import { runOwnerCommand } from "@/lib/commands";
import {
  databaseStats,
  loadDatabase,
  newId,
  nowIso,
  resetDatabase,
  saveDatabase,
} from "@/lib/db/store";
import type {
  AtlasDatabase,
  DbConversation,
  DbDocument,
  DbEvent,
  DbNotification,
  DbTask,
  DbTransaction,
} from "@/lib/db/schema";
import { err, ok, type ApiResult } from "@/lib/api/types";
import { hashPassword, verifyPassword } from "@/lib/secure-store";
import { computeTaxEstimate } from "@/lib/tax-ledger";

function db(): AtlasDatabase {
  return loadDatabase();
}

function persist(next: AtlasDatabase) {
  saveDatabase(next);
  return next;
}

/* ─── Authentication ─────────────────────────────────────────────────────── */

export const authApi = {
  signup(input: { email: string; password: string; name: string; businessName: string }): ApiResult<{
    userId: string;
    orgId: string;
  }> {
    const email = input.email.trim().toLowerCase();
    if (!email.includes("@")) return err("Enter a valid email.", 422);
    if (input.password.length < 8) return err("Password must be at least 8 characters.", 422);
    const data = db();
    if (data.users.some((u) => u.email === email)) return err("Email already registered.", 409);
    const userId = newId("user");
    const orgId = newId("org");
    const stamp = nowIso();
    persist({
      ...data,
      users: [
        {
          id: userId,
          email,
          full_name: input.name.trim() || "Atlas User",
          profile_image: null,
          timezone: "America/Chicago",
          preferred_language: "en",
          created_at: stamp,
          updated_at: stamp,
        },
        ...data.users,
      ],
      user_credentials: [
        { user_id: userId, password_hash: hashPassword(input.password) },
        ...data.user_credentials,
      ],
      organizations: [
        {
          id: orgId,
          ownerUserId: userId,
          name: input.businessName.trim() || "My Business",
          industry: "General",
          createdAt: stamp,
        },
        ...data.organizations,
      ],
      subscriptions: [
        {
          id: newId("sub"),
          orgId,
          plan: "free",
          status: "trialing",
          renewsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
          seats: 1,
        },
        ...data.subscriptions,
      ],
    });
    return ok({ userId, orgId });
  },

  login(emailRaw: string, password: string): ApiResult<{ userId: string; full_name: string }> {
    const email = emailRaw.trim().toLowerCase();
    const data = db();
    const user = data.users.find((u) => u.email === email);
    const credential = user
      ? data.user_credentials.find((c) => c.user_id === user.id)
      : undefined;
    if (!user || !credential || !verifyPassword(password, credential.password_hash)) {
      return err("Email or password doesn’t match.", 401);
    }
    return ok({ userId: user.id, full_name: user.full_name });
  },

  session(): ApiResult<{ users: number; orgs: number }> {
    const data = db();
    return ok({ users: data.users.length, orgs: data.organizations.length });
  },
};

/* ─── Users / Businesses ─────────────────────────────────────────────────── */

export const usersApi = {
  list(): ApiResult<AtlasDatabase["users"]> {
    return ok(db().users);
  },
  get(userId: string): ApiResult<AtlasDatabase["users"][number]> {
    const user = db().users.find((u) => u.id === userId);
    if (!user) return err("User not found.", 404);
    return ok(user);
  },
  update(
    userId: string,
    patch: Partial<
      Pick<AtlasDatabase["users"][number], "full_name" | "profile_image" | "timezone" | "preferred_language" | "email">
    >,
  ): ApiResult<AtlasDatabase["users"][number]> {
    const data = db();
    const existing = data.users.find((u) => u.id === userId);
    if (!existing) return err("User not found.", 404);
    const next = {
      ...existing,
      ...patch,
      email: patch.email ? patch.email.trim().toLowerCase() : existing.email,
      full_name: patch.full_name?.trim() || existing.full_name,
      updated_at: nowIso(),
    };
    persist({
      ...data,
      users: data.users.map((u) => (u.id === userId ? next : u)),
    });
    return ok(next);
  },
};

export const businessesApi = {
  list(): ApiResult<AtlasDatabase["organizations"]> {
    return ok(db().organizations);
  },
  create(ownerUserId: string, name: string, industry = "General"): ApiResult<AtlasDatabase["organizations"][number]> {
    const data = db();
    if (!data.users.some((u) => u.id === ownerUserId)) return err("Owner user not found.", 404);
    const org = {
      id: newId("org"),
      ownerUserId,
      name: name.trim() || "New business",
      industry,
      createdAt: nowIso(),
    };
    persist({ ...data, organizations: [org, ...data.organizations] });
    return ok(org);
  },
};

/* ─── Calendar / Tasks ───────────────────────────────────────────────────── */

export const calendarApi = {
  listEvents(): ApiResult<DbEvent[]> {
    return ok(db().events);
  },
  createEvent(input: Omit<DbEvent, "id">): ApiResult<DbEvent> {
    const event: DbEvent = { ...input, id: newId("evt") };
    const data = db();
    persist({ ...data, events: [event, ...data.events] });
    return ok(event);
  },
};

export const tasksApi = {
  list(): ApiResult<DbTask[]> {
    return ok(db().tasks);
  },
  create(input: Omit<DbTask, "id" | "createdAt" | "updatedAt">): ApiResult<DbTask> {
    const stamp = nowIso();
    const task: DbTask = { ...input, id: newId("task"), createdAt: stamp, updatedAt: stamp };
    const data = db();
    persist({ ...data, tasks: [task, ...data.tasks] });
    return ok(task);
  },
  updateStatus(taskId: string, status: DbTask["status"]): ApiResult<DbTask> {
    const data = db();
    const existing = data.tasks.find((t) => t.id === taskId);
    if (!existing) return err("Task not found.", 404);
    const tasks = data.tasks.map((t) =>
      t.id === taskId ? { ...t, status, updatedAt: nowIso() } : t,
    );
    persist({ ...data, tasks });
    return ok(tasks.find((t) => t.id === taskId)!);
  },
};

/* ─── Transactions / Taxes ──────────────────────────────────────────────── */

export const transactionsApi = {
  list(): ApiResult<DbTransaction[]> {
    return ok(db().transactions);
  },
  create(input: Omit<DbTransaction, "id" | "createdAt">): ApiResult<DbTransaction> {
    const row: DbTransaction = { ...input, id: newId("txn"), createdAt: nowIso() };
    const data = db();
    persist({ ...data, transactions: [row, ...data.transactions] });
    return ok(row);
  },
};

export const taxesApi = {
  listRecords(): ApiResult<AtlasDatabase["taxRecords"]> {
    return ok(db().taxRecords);
  },
  estimate(): ApiResult<ReturnType<typeof computeTaxEstimate> & { recordId: string | null }> {
    const data = db();
    const estimate = computeTaxEstimate(
      data.transactions.map((t) => ({
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
    const year = new Date().getFullYear();
    let record = data.taxRecords.find((r) => r.year === year);
    if (!record) {
      record = {
        id: newId("tax"),
        orgId: data.organizations[0]?.id || "org_demo",
        userId: data.users[0]?.id || "user_demo",
        year,
        grossIncome: estimate.grossIncome,
        expenses: estimate.expenses,
        estimatedTax: estimate.totalEstimated,
        status: "estimated",
        updatedAt: nowIso(),
      };
      persist({ ...data, taxRecords: [record, ...data.taxRecords] });
    } else {
      const taxRecords = data.taxRecords.map((r) =>
        r.id === record!.id
          ? {
              ...r,
              grossIncome: estimate.grossIncome,
              expenses: estimate.expenses,
              estimatedTax: estimate.totalEstimated,
              updatedAt: nowIso(),
            }
          : r,
      );
      persist({ ...data, taxRecords });
    }
    return ok({ ...estimate, recordId: record.id });
  },
};

/* ─── AI / Notifications / Files / Billing ───────────────────────────────── */

export const aiApi = {
  listConversations(): ApiResult<DbConversation[]> {
    return ok(db().conversations);
  },
  chat(userText: string): ApiResult<{ reply: string; conversation: DbConversation }> {
    const trimmed = userText.trim();
    if (!trimmed) return err("Message required.", 422);
    const result = runOwnerCommand(trimmed);
    const data = db();
    const stamp = nowIso();
    const userId = data.users[0]?.id || "user_demo";
    let conversation = data.conversations[0];
    if (!conversation) {
      conversation = {
        id: newId("chat"),
        userId,
        title: trimmed.slice(0, 48),
        preview: result.reply.slice(0, 80),
        messages: [],
        createdAt: stamp,
        updatedAt: stamp,
      };
    }
    conversation = {
      ...conversation,
      title: conversation.title || trimmed.slice(0, 48),
      preview: result.reply.slice(0, 80),
      updatedAt: stamp,
      messages: [
        ...conversation.messages,
        { role: "user", text: trimmed, at: stamp },
        { role: "ai", text: `[${result.agentLabel}] ${result.reply}`, at: stamp },
      ],
    };
    const conversations = data.conversations.some((c) => c.id === conversation.id)
      ? data.conversations.map((c) => (c.id === conversation.id ? conversation : c))
      : [conversation, ...data.conversations];
    persist({ ...data, conversations });
    return ok({ reply: result.reply, conversation });
  },
  listMemories(): ApiResult<AtlasDatabase["memories"]> {
    return ok(db().memories);
  },
};

export const notificationsApi = {
  list(userId?: string): ApiResult<DbNotification[]> {
    const notes = db().notifications;
    return ok(userId ? notes.filter((n) => n.userId === userId) : notes);
  },
  markRead(id: string): ApiResult<DbNotification> {
    const data = db();
    const existing = data.notifications.find((n) => n.id === id);
    if (!existing) return err("Notification not found.", 404);
    const notifications = data.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    persist({ ...data, notifications });
    return ok(notifications.find((n) => n.id === id)!);
  },
};

export const filesApi = {
  list(): ApiResult<DbDocument[]> {
    return ok(db().documents);
  },
  upload(input: {
    userId: string;
    orgId: string;
    title: string;
    content: string;
    kind?: DbDocument["kind"];
  }): ApiResult<DbDocument> {
    const stamp = nowIso();
    const doc: DbDocument = {
      id: newId("doc"),
      userId: input.userId,
      orgId: input.orgId,
      title: input.title.trim() || "Untitled",
      kind: input.kind || "file",
      content: input.content,
      createdAt: stamp,
      updatedAt: stamp,
    };
    const data = db();
    persist({ ...data, documents: [doc, ...data.documents] });
    return ok(doc);
  },
};

export const billingApi = {
  getSubscription(): ApiResult<AtlasDatabase["subscriptions"][number] | null> {
    return ok(db().subscriptions[0] || null);
  },
  list(): ApiResult<AtlasDatabase["subscriptions"]> {
    return ok(db().subscriptions);
  },
  changePlan(plan: AtlasDatabase["subscriptions"][number]["plan"]): ApiResult<AtlasDatabase["subscriptions"][number]> {
    const data = db();
    const current = data.subscriptions[0];
    if (!current) return err("No subscription found.", 404);
    const next = {
      ...current,
      plan,
      status: "active" as const,
      renewsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    persist({ ...data, subscriptions: [next, ...data.subscriptions.slice(1)] });
    return ok(next);
  },
};

/* ─── Meta ───────────────────────────────────────────────────────────────── */

export const metaApi = {
  architecture() {
    return ok({
      frontend: ["Dashboard", "Calendar", "Tax Center", "AI Chat", "Files", "Settings"],
      backendApi: [
        "Authentication",
        "Users",
        "Businesses",
        "Calendar",
        "Tasks",
        "Transactions",
        "Taxes",
        "AI",
        "Notifications",
        "Files",
        "Billing",
      ],
      database: [
        "Users",
        "Organizations",
        "Events",
        "Tasks",
        "Transactions",
        "Tax Records",
        "Conversations",
        "Memories",
        "Documents",
        "Subscriptions",
      ],
      stats: databaseStats(db()),
    });
  },
  reset(): ApiResult<{ stats: ReturnType<typeof databaseStats> }> {
    const data = resetDatabase();
    return ok({ stats: databaseStats(data) });
  },
  health(): ApiResult<{ status: "ok"; engine: string; tables: number }> {
    const stats = databaseStats(db());
    return ok({
      status: "ok",
      engine: "atlas-database-v1 (localStorage)",
      tables: Object.keys(stats).length,
    });
  },
};

export const atlasApi = {
  auth: authApi,
  users: usersApi,
  businesses: businessesApi,
  calendar: calendarApi,
  tasks: tasksApi,
  transactions: transactionsApi,
  taxes: taxesApi,
  ai: aiApi,
  notifications: notificationsApi,
  files: filesApi,
  billing: billingApi,
  meta: metaApi,
};

export type AtlasApi = typeof atlasApi;
