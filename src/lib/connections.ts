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
    // Merge catalog + keep any custom services the user added
    const byId = new Map(parsed.map((c) => [c.id, c]));
    const catalogIds = new Set(CATALOG.map((item) => item.id));
    const merged = CATALOG.map((item) => {
      const existing = byId.get(item.id);
      if (existing) {
        return {
          ...item,
          ...existing,
          permissions: existing.permissions?.length ? existing.permissions : item.permissions,
          detail: existing.detail || item.detail,
          name: existing.name || item.name,
        };
      }
      return {
        ...item,
        connected: false,
        accountLabel: null,
        connectedAt: null,
        lastSyncAt: null,
        health: "disconnected" as const,
      };
    });
    const customs = parsed.filter((c) => !catalogIds.has(c.id));
    return [...merged, ...customs];
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

export function updateConnection(
  id: string,
  patch: Partial<Pick<ServiceConnection, "accountLabel" | "detail" | "name" | "health" | "permissions">>,
): ServiceConnection[] {
  const next = loadConnections().map((c) =>
    c.id === id
      ? {
          ...c,
          ...patch,
          accountLabel:
            patch.accountLabel !== undefined
              ? patch.accountLabel?.trim() || null
              : c.accountLabel,
          detail: patch.detail !== undefined ? patch.detail.trim() || c.detail : c.detail,
          name: patch.name !== undefined ? patch.name.trim() || c.name : c.name,
        }
      : c,
  );
  saveConnections(next);
  return next;
}

function slugId(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return `custom-${base || "service"}-${Date.now().toString(36)}`;
}

export function addCustomConnection(input: {
  name: string;
  category?: ServiceConnection["category"];
  detail?: string;
  accountLabel?: string;
  permissions?: string[];
  connect?: boolean;
}): ServiceConnection[] {
  const stamp = nowIso();
  const name = input.name.trim() || "Custom service";
  const connect = input.connect !== false;
  const item: ServiceConnection = {
    id: slugId(name),
    name,
    category: input.category || "comms",
    accountLabel: connect ? input.accountLabel?.trim() || `connected@${name.toLowerCase().replace(/\s+/g, "")}.com` : null,
    connected: connect,
    connectedAt: connect ? stamp : null,
    lastSyncAt: connect ? stamp : null,
    permissions: input.permissions?.length ? input.permissions : ["Read data", "Sync on demand"],
    health: connect ? "healthy" : "disconnected",
    detail: input.detail?.trim() || "Custom integration you added.",
  };
  const next = [item, ...loadConnections()];
  saveConnections(next);
  return next;
}

export function removeConnection(id: string): ServiceConnection[] {
  const next = loadConnections().filter((c) => c.id !== id);
  saveConnections(next.length ? next : seedConnections());
  return loadConnections();
}

export function connectionStats(items = loadConnections()) {
  return {
    total: items.length,
    connected: items.filter((c) => c.connected).length,
    attention: items.filter((c) => c.health === "needs_attention").length,
  };
}
