export type ConnectionHealth = "healthy" | "syncing" | "needs_attention" | "disconnected";

export type ServiceConnection = {
  id: string;
  name: string;
  category: "identity" | "payments" | "banking" | "accounting" | "commerce" | "comms" | "storage";
  accountLabel: string | null;
  connected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  permissions: string[];
  health: ConnectionHealth;
  detail: string;
};

const STORAGE_KEY = "atlas-connections-v1";

const CATALOG: Omit<ServiceConnection, "connected" | "connectedAt" | "lastSyncAt" | "health" | "accountLabel">[] = [
  {
    id: "google",
    name: "Google",
    category: "identity",
    permissions: ["Calendar read/write", "Contacts read", "Email send (draft)"],
    detail: "Calendar, contacts, and Gmail drafts.",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    category: "identity",
    permissions: ["Outlook calendar", "OneDrive files", "Teams notify"],
    detail: "Outlook calendar and OneDrive.",
  },
  {
    id: "stripe",
    name: "Stripe",
    category: "payments",
    permissions: ["Read payments", "Create invoices", "Refunds (confirm required)"],
    detail: "Cards, invoices, and payouts.",
  },
  {
    id: "paypal",
    name: "PayPal",
    category: "payments",
    permissions: ["Read balance", "Send payouts (confirm required)"],
    detail: "Customer PayPal checkout and payouts.",
  },
  {
    id: "banks",
    name: "Banks",
    category: "banking",
    permissions: ["Read transactions", "Balances"],
    detail: "Bank feed for tax and cash flow.",
  },
  {
    id: "quickbooks",
    name: "QuickBooks",
    category: "accounting",
    permissions: ["Chart of accounts", "Sync expenses", "Export journals"],
    detail: "Accounting sync for books and tax.",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "commerce",
    permissions: ["Orders read", "Products read", "Customers read"],
    detail: "Store orders and customer sync.",
  },
  {
    id: "slack",
    name: "Slack",
    category: "comms",
    permissions: ["Post to channels", "Read mentions"],
    detail: "Team alerts and Atlas bot replies.",
  },
  {
    id: "zoom",
    name: "Zoom",
    category: "comms",
    permissions: ["Create meetings", "Read recordings metadata"],
    detail: "Meeting links on calendar events.",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    category: "storage",
    permissions: ["Read files", "Upload files", "Shared folders"],
    detail: "Document and receipt storage.",
  },
];

function nowIso() {
  return new Date().toISOString();
}

function minutesAgo(mins: number) {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function seedConnections(): ServiceConnection[] {
  return CATALOG.map((item, index) => {
    const connected = index < 4;
    return {
      ...item,
      connected,
      accountLabel: connected ? `demo@${item.id === "banks" ? "firstnational.bank" : `${item.id}.com`}` : null,
      connectedAt: connected ? minutesAgo(60 * 24 * (index + 2)) : null,
      lastSyncAt: connected ? minutesAgo(12 + index * 7) : null,
      health: connected ? (index === 3 ? "needs_attention" : "healthy") : "disconnected",
    };
  });
}

export function loadConnections(): ServiceConnection[] {
  if (typeof window === "undefined") return seedConnections();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedConnections();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ServiceConnection[];
    if (!Array.isArray(parsed) || !parsed.length) return seedConnections();
    // Merge new catalog entries
    const byId = new Map(parsed.map((c) => [c.id, c]));
    return CATALOG.map((item) => {
      const existing = byId.get(item.id);
      if (existing) return { ...item, ...existing, permissions: item.permissions, detail: item.detail, name: item.name };
      return {
        ...item,
        connected: false,
        accountLabel: null,
        connectedAt: null,
        lastSyncAt: null,
        health: "disconnected" as const,
      };
    });
  } catch {
    return seedConnections();
  }
}

export function saveConnections(items: ServiceConnection[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function connectService(id: string, accountLabel?: string): ServiceConnection[] {
  const stamp = nowIso();
  const next = loadConnections().map((c) =>
    c.id === id
      ? {
          ...c,
          connected: true,
          accountLabel: accountLabel || `connected@${c.id}.com`,
          connectedAt: c.connectedAt || stamp,
          lastSyncAt: stamp,
          health: "healthy" as const,
        }
      : c,
  );
  saveConnections(next);
  return next;
}

export function disconnectService(id: string): ServiceConnection[] {
  const next = loadConnections().map((c) =>
    c.id === id
      ? {
          ...c,
          connected: false,
          accountLabel: null,
          lastSyncAt: null,
          health: "disconnected" as const,
        }
      : c,
  );
  saveConnections(next);
  return next;
}

export function syncService(id: string): ServiceConnection[] {
  const stamp = nowIso();
  const next = loadConnections().map((c) =>
    c.id === id && c.connected
      ? { ...c, lastSyncAt: stamp, health: "healthy" as const }
      : c,
  );
  saveConnections(next);
  return next;
}

export function connectionStats(items = loadConnections()) {
  return {
    total: items.length,
    connected: items.filter((c) => c.connected).length,
    attention: items.filter((c) => c.health === "needs_attention").length,
  };
}
