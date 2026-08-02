export type AdminAccountStatus = "active" | "past_due" | "suspended" | "deleted";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "business" | "enterprise";
  status: AdminAccountStatus;
  storageMb: number;
  aiRequests: number;
  createdAt: string;
  lastActiveAt: string;
};

export type AdminSupportRequest = {
  id: string;
  userEmail: string;
  subject: string;
  priority: "low" | "normal" | "high";
  status: "open" | "waiting" | "resolved";
  at: string;
};

export type AdminSuspicious = {
  id: string;
  at: string;
  title: string;
  detail: string;
  severity: "info" | "warn" | "critical";
};

export type AdminSnapshot = {
  users: AdminUser[];
  failedPayments: { id: string; email: string; amount: number; at: string; reason: string }[];
  supportRequests: AdminSupportRequest[];
  suspicious: AdminSuspicious[];
  errors: { id: string; at: string; code: string; technical: string }[];
  systemHealth: { name: string; status: "ok" | "degraded" | "down"; detail: string }[];
  metrics: {
    activeSubscriptions: number;
    mrr: number;
    storageGb: number;
    aiRequests24h: number;
    errorRate: number;
  };
};

const STORAGE_KEY = "atlas-admin-v1";

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function seedAdmin(): AdminSnapshot {
  const users: AdminUser[] = [
    {
      id: newId("usr"),
      name: "Jeff Owner",
      email: "jeff@atlas.demo",
      plan: "business",
      status: "active",
      storageMb: 842,
      aiRequests: 1284,
      createdAt: daysAgo(120),
      lastActiveAt: daysAgo(0),
    },
    {
      id: newId("usr"),
      name: "Jamie Cole",
      email: "jamie@email.com",
      plan: "pro",
      status: "active",
      storageMb: 210,
      aiRequests: 340,
      createdAt: daysAgo(45),
      lastActiveAt: daysAgo(1),
    },
    {
      id: newId("usr"),
      name: "Harbor Dental",
      email: "ops@harbordental.demo",
      plan: "business",
      status: "past_due",
      storageMb: 1260,
      aiRequests: 890,
      createdAt: daysAgo(200),
      lastActiveAt: daysAgo(3),
    },
    {
      id: newId("usr"),
      name: "Sam Rivera",
      email: "sam@field.demo",
      plan: "free",
      status: "active",
      storageMb: 48,
      aiRequests: 22,
      createdAt: daysAgo(12),
      lastActiveAt: daysAgo(0),
    },
    {
      id: newId("usr"),
      name: "Suspended Demo",
      email: "risk@example.com",
      plan: "pro",
      status: "suspended",
      storageMb: 90,
      aiRequests: 12,
      createdAt: daysAgo(30),
      lastActiveAt: daysAgo(18),
    },
  ];

  return {
    users,
    failedPayments: [
      {
        id: newId("pay"),
        email: "ops@harbordental.demo",
        amount: 149,
        at: daysAgo(2),
        reason: "Card declined",
      },
      {
        id: newId("pay"),
        email: "billing@oldco.demo",
        amount: 49,
        at: daysAgo(6),
        reason: "Insufficient funds",
      },
    ],
    supportRequests: [
      {
        id: newId("sup"),
        userEmail: "jamie@email.com",
        subject: "Cannot reconnect Google Calendar",
        priority: "high",
        status: "open",
        at: daysAgo(0),
      },
      {
        id: newId("sup"),
        userEmail: "sam@field.demo",
        subject: "How do I export tax CSV?",
        priority: "normal",
        status: "waiting",
        at: daysAgo(1),
      },
    ],
    suspicious: [
      {
        id: newId("sus"),
        at: daysAgo(0),
        title: "Multiple failed logins",
        detail: "risk@example.com · 9 failures in 12 minutes",
        severity: "critical",
      },
      {
        id: newId("sus"),
        at: daysAgo(1),
        title: "Unusual export volume",
        detail: "ops@harbordental.demo exported account JSON 4 times",
        severity: "warn",
      },
    ],
    errors: [
      {
        id: newId("err"),
        at: daysAgo(0),
        code: "SYNC_FAILED",
        technical: "Stripe webhook timeout 504",
      },
      {
        id: newId("err"),
        at: daysAgo(0),
        code: "SAVE_EVENT",
        technical: "Calendar writer conflict on evt_991",
      },
    ],
    systemHealth: [
      { name: "API gateway", status: "ok", detail: "p95 84ms" },
      { name: "Local vault", status: "ok", detail: "Write success 99.9%" },
      { name: "AI chat", status: "ok", detail: "Keyword + demo replies" },
      { name: "Payments", status: "degraded", detail: "2 failed charges in queue" },
      { name: "Email delivery", status: "ok", detail: "Prototype queue healthy" },
    ],
    metrics: {
      activeSubscriptions: users.filter((u) => u.status === "active" && u.plan !== "free").length,
      mrr: 149 * 2 + 49,
      storageGb: Math.round((users.reduce((s, u) => s + u.storageMb, 0) / 1024) * 10) / 10,
      aiRequests24h: 412,
      errorRate: 0.4,
    },
  };
}

export function loadAdminSnapshot(): AdminSnapshot {
  if (typeof window === "undefined") return seedAdmin();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedAdmin();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as AdminSnapshot;
  } catch {
    return seedAdmin();
  }
}

export function saveAdminSnapshot(snapshot: AdminSnapshot) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function suspendAccount(userId: string) {
  const snap = loadAdminSnapshot();
  const users = snap.users.map((u) =>
    u.id === userId ? { ...u, status: "suspended" as const } : u,
  );
  const next = { ...snap, users };
  saveAdminSnapshot(next);
  return next;
}

export function restoreAccount(userId: string) {
  const snap = loadAdminSnapshot();
  const users = snap.users.map((u) =>
    u.id === userId ? { ...u, status: "active" as const } : u,
  );
  const next = {
    ...snap,
    users,
    suspicious: [
      {
        id: newId("sus"),
        at: new Date().toISOString(),
        title: "Account restored",
        detail: `${users.find((u) => u.id === userId)?.email || userId} restored by admin`,
        severity: "info" as const,
      },
      ...snap.suspicious,
    ],
  };
  saveAdminSnapshot(next);
  return next;
}

export function restoreUserData(userId: string) {
  const snap = loadAdminSnapshot();
  const user = snap.users.find((u) => u.id === userId);
  const next = {
    ...snap,
    suspicious: [
      {
        id: newId("sus"),
        at: new Date().toISOString(),
        title: "Data restore started",
        detail: `Safe restore queued for ${user?.email || userId} (demo).`,
        severity: "info" as const,
      },
      ...snap.suspicious,
    ],
  };
  saveAdminSnapshot(next);
  return { snapshot: next, message: `Safe data restore queued for ${user?.email || "account"}.` };
}
