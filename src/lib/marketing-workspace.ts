/** Marketing campaign center — channels, lists, coupons, scheduling, attribution (honest DEMO vs LIVE). */

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type MarketingChannel = "email" | "sms" | "social" | "post";

export type ConnectedAccount = {
  id: string;
  kind: MarketingChannel;
  name: string;
  connected: boolean;
};

export type MarketingCampaign = {
  id: string;
  name: string;
  channel: MarketingChannel;
  status: "draft" | "scheduled" | "sent" | "active";
  audience: string;
  scheduledAt?: string;
  opens?: number;
  clicks?: number;
  redemptions?: number;
  revenueAttributed?: number;
  hasLiveData: boolean;
  createdAt: string;
};

const CAMPAIGNS_KEY = "atlas-marketing-campaigns-v1";
const ACCOUNTS_KEY = "atlas-marketing-accounts-v1";

export const DEFAULT_ACCOUNTS: ConnectedAccount[] = [
  { id: "gmb", kind: "social", name: "Google Business Profile", connected: false },
  { id: "fb", kind: "social", name: "Facebook Page", connected: false },
  { id: "mail", kind: "email", name: "Email (Resend)", connected: false },
  { id: "sms", kind: "sms", name: "SMS (Twilio)", connected: false },
];

export function loadConnectedAccounts(): ConnectedAccount[] {
  const saved = loadJson<ConnectedAccount[]>(ACCOUNTS_KEY, []);
  return saved.length ? saved : DEFAULT_ACCOUNTS;
}

export function saveConnectedAccounts(accounts: ConnectedAccount[]) {
  saveJson(ACCOUNTS_KEY, accounts);
}

export function loadCampaigns(): MarketingCampaign[] {
  return loadJson<MarketingCampaign[]>(CAMPAIGNS_KEY, []);
}

export function saveCampaigns(items: MarketingCampaign[]) {
  saveJson(CAMPAIGNS_KEY, items);
}

export function createCampaign(input: {
  name: string;
  channel: MarketingChannel;
  audience: string;
  scheduledAt?: string;
}): MarketingCampaign {
  const campaign: MarketingCampaign = {
    id: newId("camp"),
    name: input.name.trim(),
    channel: input.channel,
    status: input.scheduledAt ? "scheduled" : "draft",
    audience: input.audience,
    scheduledAt: input.scheduledAt,
    hasLiveData: false,
    createdAt: nowIso(),
  };
  saveCampaigns([campaign, ...loadCampaigns()]);
  return campaign;
}

export function marketingDataMode(): "LIVE" | "DEMO" {
  const accounts = loadConnectedAccounts();
  return accounts.some((a) => a.connected) ? "LIVE" : "DEMO";
}

export function campaignSummary(): {
  mode: "LIVE" | "DEMO";
  totalRevenue: number | null;
  note: string;
} {
  const mode = marketingDataMode();
  const campaigns = loadCampaigns();
  if (mode === "DEMO" || !campaigns.some((c) => c.hasLiveData)) {
    return {
      mode: "DEMO",
      totalRevenue: null,
      note: "Connect email, SMS, or social accounts to track opens, clicks, redemptions, and revenue.",
    };
  }
  const total = campaigns.reduce((s, c) => s + (c.revenueAttributed ?? 0), 0);
  return { mode: "LIVE", totalRevenue: total, note: "Revenue attributed from connected campaigns and CRM." };
}
