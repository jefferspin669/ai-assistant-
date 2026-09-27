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
  DbCalendarCategory,
  DbCalendarEvent,
  DbNotification,
  DbOrganizationMember,
  DbTask,
  DbTransaction,
  EventPriority,
  OrgMemberRole,
} from "@/lib/db/schema";
import { err, ok, type ApiResult } from "@/lib/api/types";
import { hashPassword, verifyPassword } from "@/lib/secure-store";
import { computeTaxEstimate } from "@/lib/tax-ledger";
import { assertSeatAvailable } from "@/lib/billing/entitlements";

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
          email_verified_at: null,
          created_at: stamp,
          updated_at: stamp,
        },
        ...data.users,
      ],
      user_credentials: [
        { user_id: userId, password_hash: hashPassword(input.password), mfa_secret: null, mfa_enabled: false },
        ...data.user_credentials,
      ],
      organizations: [
        {
          id: orgId,
          owner_id: userId,
          business_name: input.businessName.trim() || "My Business",
          logo_url: null,
          business_type: "General",
          tax_structure: "Sole proprietor",
          state: "TX",
          created_at: stamp,
        },
        ...data.organizations,
      ],
      organization_members: [
        {
          id: newId("om"),
          organization_id: orgId,
          user_id: userId,
          role: "owner",
          status: "active",
          joined_at: stamp,
        },
        ...data.organization_members,
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
  get(orgId: string): ApiResult<AtlasDatabase["organizations"][number]> {
    const org = db().organizations.find((o) => o.id === orgId);
    if (!org) return err("Organization not found.", 404);
    return ok(org);
  },
  create(input: {
    owner_id: string;
    business_name: string;
    business_type?: string;
    tax_structure?: string;
    state?: string;
    logo_url?: string | null;
  }): ApiResult<AtlasDatabase["organizations"][number]> {
    const data = db();
    if (!data.users.some((u) => u.id === input.owner_id)) return err("Owner user not found.", 404);
    const org = {
      id: newId("org"),
      owner_id: input.owner_id,
      business_name: input.business_name.trim() || "New business",
      logo_url: input.logo_url ?? null,
      business_type: input.business_type?.trim() || "General",
      tax_structure: input.tax_structure?.trim() || "Sole proprietor",
      state: (input.state || "TX").trim().toUpperCase().slice(0, 2),
      created_at: nowIso(),
    };
    const member: DbOrganizationMember = {
      id: newId("om"),
      organization_id: org.id,
      user_id: input.owner_id,
      role: "owner",
      status: "active",
      joined_at: org.created_at,
    };
    persist({
      ...data,
      organizations: [org, ...data.organizations],
      organization_members: [member, ...data.organization_members],
    });
    return ok(org);
  },
  update(
    orgId: string,
    patch: Partial<
      Pick<
        AtlasDatabase["organizations"][number],
        "business_name" | "logo_url" | "business_type" | "tax_structure" | "state" | "owner_id"
      >
    >,
  ): ApiResult<AtlasDatabase["organizations"][number]> {
    const data = db();
    const existing = data.organizations.find((o) => o.id === orgId);
    if (!existing) return err("Organization not found.", 404);
    const next = {
      ...existing,
      ...patch,
      business_name: patch.business_name?.trim() || existing.business_name,
      business_type: patch.business_type?.trim() || existing.business_type,
      tax_structure: patch.tax_structure?.trim() || existing.tax_structure,
      state: patch.state
        ? patch.state.trim().toUpperCase().slice(0, 2)
        : existing.state,
    };
    persist({
      ...data,
      organizations: data.organizations.map((o) => (o.id === orgId ? next : o)),
    });
    return ok(next);
  },
};

export const organizationMembersApi = {
  list(organizationId?: string): ApiResult<DbOrganizationMember[]> {
    const rows = db().organization_members;
    return ok(organizationId ? rows.filter((m) => m.organization_id === organizationId) : rows);
  },
  invite(input: {
    organization_id: string;
    user_id?: string;
    email?: string;
    full_name?: string;
    role?: OrgMemberRole;
  }): ApiResult<DbOrganizationMember> {
    const data = db();
    const org = data.organizations.find((o) => o.id === input.organization_id);
    if (!org) return err("Organization not found.", 404);

    let userId = input.user_id || "";
    if (!userId) {
      const email = (input.email || "").trim().toLowerCase();
      if (!email.includes("@")) return err("Provide user_id or a valid email.", 422);
      const existingUser = data.users.find((u) => u.email === email);
      if (existingUser) {
        userId = existingUser.id;
      } else {
        const stamp = nowIso();
        userId = newId("user");
        data.users = [
          {
            id: userId,
            email,
            full_name: input.full_name?.trim() || email.split("@")[0],
            profile_image: null,
            timezone: "America/Chicago",
            preferred_language: "en",
            email_verified_at: null,
            created_at: stamp,
            updated_at: stamp,
          },
          ...data.users,
        ];
      }
    } else if (!data.users.some((u) => u.id === userId)) {
      return err("User not found.", 404);
    }

    if (
      data.organization_members.some(
        (m) =>
          m.organization_id === input.organization_id &&
          m.user_id === userId &&
          m.status !== "removed",
      )
    ) {
      return err("User is already a member of this organization.", 409);
    }

    const seats = assertSeatAvailable(input.organization_id);
    if (!seats.ok) {
      return err(`Plan seat limit reached (${seats.used}/${seats.cap}). Upgrade to invite more people.`, 402);
    }

    const member: DbOrganizationMember = {
      id: newId("om"),
      organization_id: input.organization_id,
      user_id: userId,
      role: input.role || "employee",
      status: "invited",
      joined_at: nowIso(),
    };
    persist({
      ...data,
      users: data.users,
      organization_members: [member, ...data.organization_members],
    });
    return ok(member);
  },
  update(
    memberId: string,
    patch: Partial<Pick<DbOrganizationMember, "role" | "status">>,
  ): ApiResult<DbOrganizationMember> {
    const data = db();
    const existing = data.organization_members.find((m) => m.id === memberId);
    if (!existing) return err("Member not found.", 404);
    const next = { ...existing, ...patch };
    persist({
      ...data,
      organization_members: data.organization_members.map((m) => (m.id === memberId ? next : m)),
    });
    return ok(next);
  },
};

/* ─── Calendar / Tasks ───────────────────────────────────────────────────── */

export const calendarApi = {
  listCategories(filters?: {
    user_id?: string;
    organization_id?: string;
  }): ApiResult<DbCalendarCategory[]> {
    let rows = db().calendar_categories;
    if (filters?.user_id) rows = rows.filter((c) => c.user_id === filters.user_id);
    if (filters?.organization_id) {
      rows = rows.filter((c) => c.organization_id === filters.organization_id);
    }
    return ok(rows);
  },
  createCategory(input: {
    user_id: string;
    organization_id: string;
    name: string;
    color?: string;
    icon?: string;
    id?: string;
  }): ApiResult<DbCalendarCategory> {
    const data = db();
    if (!data.users.some((u) => u.id === input.user_id)) return err("User not found.", 404);
    if (!data.organizations.some((o) => o.id === input.organization_id)) {
      return err("Organization not found.", 404);
    }
    const name = input.name.trim() || "Custom";
    const id =
      input.id?.trim() ||
      `cat-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${newId("x").slice(-6)}`;
    if (data.calendar_categories.some((c) => c.id === id)) {
      return err("Category id already exists.", 409);
    }
    const category: DbCalendarCategory = {
      id,
      user_id: input.user_id,
      organization_id: input.organization_id,
      name,
      color: input.color || "#2f8f8a",
      icon: input.icon?.trim() || "tag",
    };
    persist({ ...data, calendar_categories: [category, ...data.calendar_categories] });
    return ok(category);
  },
  updateCategory(
    categoryId: string,
    patch: Partial<Pick<DbCalendarCategory, "name" | "color" | "icon">>,
  ): ApiResult<DbCalendarCategory> {
    const data = db();
    const existing = data.calendar_categories.find((c) => c.id === categoryId);
    if (!existing) return err("Calendar category not found.", 404);
    const next = {
      ...existing,
      ...patch,
      name: patch.name?.trim() || existing.name,
      icon: patch.icon?.trim() || existing.icon,
    };
    persist({
      ...data,
      calendar_categories: data.calendar_categories.map((c) => (c.id === categoryId ? next : c)),
    });
    return ok(next);
  },
  listEvents(filters?: {
    user_id?: string;
    organization_id?: string;
  }): ApiResult<DbCalendarEvent[]> {
    let rows = db().calendar_events;
    if (filters?.user_id) rows = rows.filter((e) => e.user_id === filters.user_id);
    if (filters?.organization_id) {
      rows = rows.filter((e) => e.organization_id === filters.organization_id);
    }
    return ok([...rows].sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time)));
  },
  get(eventId: string): ApiResult<DbCalendarEvent> {
    const event = db().calendar_events.find((e) => e.id === eventId);
    if (!event) return err("Calendar event not found.", 404);
    return ok(event);
  },
  createEvent(input: {
    user_id: string;
    organization_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    timezone?: string;
    category_id?: string;
    location?: string;
    priority?: EventPriority;
    reminder_time?: string | null;
    recurring_rule?: string | null;
    external_calendar_id?: string | null;
  }): ApiResult<DbCalendarEvent> {
    const data = db();
    if (!data.users.some((u) => u.id === input.user_id)) return err("User not found.", 404);
    if (!data.organizations.some((o) => o.id === input.organization_id)) {
      return err("Organization not found.", 404);
    }
    const start = input.start_time || nowIso();
    const end =
      input.end_time || new Date(new Date(start).getTime() + 60 * 60000).toISOString();
    const event: DbCalendarEvent = {
      id: newId("evt"),
      user_id: input.user_id,
      organization_id: input.organization_id,
      title: input.title.trim() || "Untitled event",
      description: (input.description || "").trim(),
      start_time: start,
      end_time: end,
      timezone: input.timezone || "America/Chicago",
      category_id: input.category_id || "work",
      location: (input.location || "").trim(),
      priority: input.priority || "normal",
      reminder_time: input.reminder_time ?? null,
      recurring_rule: input.recurring_rule ?? null,
      external_calendar_id: input.external_calendar_id ?? null,
      created_at: nowIso(),
    };
    persist({ ...data, calendar_events: [event, ...data.calendar_events] });
    return ok(event);
  },
  update(
    eventId: string,
    patch: Partial<
      Pick<
        DbCalendarEvent,
        | "title"
        | "description"
        | "start_time"
        | "end_time"
        | "timezone"
        | "category_id"
        | "location"
        | "priority"
        | "reminder_time"
        | "recurring_rule"
        | "external_calendar_id"
      >
    >,
  ): ApiResult<DbCalendarEvent> {
    const data = db();
    const existing = data.calendar_events.find((e) => e.id === eventId);
    if (!existing) return err("Calendar event not found.", 404);
    const next = {
      ...existing,
      ...patch,
      title: patch.title?.trim() || existing.title,
    };
    persist({
      ...data,
      calendar_events: data.calendar_events.map((e) => (e.id === eventId ? next : e)),
    });
    return ok(next);
  },
  deleteEvent(eventId: string): ApiResult<{ id: string }> {
    const data = db();
    if (!data.calendar_events.some((e) => e.id === eventId)) {
      return err("Calendar event not found.", 404);
    }
    persist({
      ...data,
      calendar_events: data.calendar_events.filter((e) => e.id !== eventId),
    });
    return ok({ id: eventId });
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
  update(
    taskId: string,
    patch: Partial<Pick<DbTask, "title" | "notes" | "status" | "priority" | "dueDate" | "category">>,
  ): ApiResult<DbTask> {
    const data = db();
    const existing = data.tasks.find((t) => t.id === taskId);
    if (!existing) return err("Task not found.", 404);
    const next = {
      ...existing,
      ...patch,
      title: patch.title?.trim() || existing.title,
      updatedAt: nowIso(),
    };
    persist({
      ...data,
      tasks: data.tasks.map((t) => (t.id === taskId ? next : t)),
    });
    return ok(next);
  },
  updateStatus(taskId: string, status: DbTask["status"]): ApiResult<DbTask> {
    return tasksApi.update(taskId, { status });
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
        category: t.category || "",
        date: t.date,
        notes: "",
        receiptName: t.receiptName,
        createdAt: t.createdAt,
      })),
    );
    const year = new Date().getFullYear();
    const orgId = data.organizations[0]?.id;
    const userId = data.users[0]?.id;
    if (!orgId || !userId) return err("No workspace is available for tax estimates.", 401);
    let record = data.taxRecords.find((r) => r.year === year);
    if (!record) {
      record = {
        id: newId("tax"),
        orgId,
        userId,
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
    const userId = data.users[0]?.id;
    if (!userId) return err("No workspace user is available for chat.", 401);
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
  deleteConversation(conversationId: string): ApiResult<{ id: string }> {
    const data = db();
    if (!data.conversations.some((c) => c.id === conversationId)) {
      return err("Conversation not found.", 404);
    }
    persist({
      ...data,
      conversations: data.conversations.filter((c) => c.id !== conversationId),
    });
    return ok({ id: conversationId });
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
    fileName?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }): ApiResult<DbDocument> {
    const stamp = nowIso();
    const doc: DbDocument = {
      id: newId("doc"),
      userId: input.userId,
      orgId: input.orgId,
      title: input.title.trim() || "Untitled",
      kind: input.kind || "file",
      content: input.content,
      fileName: input.fileName ?? null,
      mimeType: input.mimeType ?? null,
      sizeBytes: input.sizeBytes ?? null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    const data = db();
    persist({ ...data, documents: [doc, ...data.documents] });
    return ok(doc);
  },
  delete(fileId: string): ApiResult<{ id: string }> {
    const data = db();
    if (!data.documents.some((d) => d.id === fileId)) return err("File not found.", 404);
    persist({
      ...data,
      documents: data.documents.filter((d) => d.id !== fileId),
    });
    return ok({ id: fileId });
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
      ],
      stats: databaseStats(db()),
    });
  },
  reset(): ApiResult<{ stats: ReturnType<typeof databaseStats> }> {
    const data = resetDatabase();
    return ok({ stats: databaseStats(data) });
  },
  health(): ApiResult<{
    status: "ok";
    engine: string;
    tables: number;
    persistence: string;
  }> {
    const stats = databaseStats(db());
    const persistence =
      typeof window === "undefined"
        ? process.env.DATABASE_URL?.trim()
          ? "postgres"
          : "file:.data/atlas-db.json"
        : "localStorage:atlas-database-v5";
    return ok({
      status: "ok",
      engine: "atlas-database-v5",
      tables: Object.keys(stats).length,
      persistence,
    });
  },
};

export const atlasApi = {
  auth: authApi,
  users: usersApi,
  businesses: businessesApi,
  organizationMembers: organizationMembersApi,
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
