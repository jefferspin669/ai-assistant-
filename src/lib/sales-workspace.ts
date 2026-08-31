/** Sales performance — pipeline, win rate, honest labeling when no connected revenue data. */

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

export type SalesOpportunity = {
  id: string;
  name: string;
  customer: string;
  employee: string;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
  amount: number | null;
  expectedClose?: string;
  hasVerifiedAmount: boolean;
  createdAt: string;
};

export type SalesMetrics = {
  mode: "LIVE" | "DEMO" | "MANUAL";
  pipelineValue: number | null;
  closedRevenue: number | null;
  recurringRevenue: number | null;
  winRate: number | null;
  avgDealSize: number | null;
  leadCount: number;
  opportunityCount: number;
  note: string;
};

const OPP_KEY = "atlas-sales-opps-v1";
const LIVE_KEY = "atlas-sales-live-v1";

const SEED_OPPS: SalesOpportunity[] = [
  {
    id: "opp-1",
    name: "North campus HVAC",
    customer: "Brookdale Properties",
    employee: "Marcus Lee",
    stage: "proposal",
    amount: null,
    hasVerifiedAmount: false,
    createdAt: nowIso(),
  },
  {
    id: "opp-2",
    name: "Annual maintenance",
    customer: "Johnson Construction",
    employee: "Sarah Williams",
    stage: "qualified",
    amount: 8400,
    hasVerifiedAmount: true,
    expectedClose: "Sep 15",
    createdAt: nowIso(),
  },
];

export function loadOpportunities(): SalesOpportunity[] {
  const saved = loadJson<SalesOpportunity[]>(OPP_KEY, []);
  return saved.length ? saved : SEED_OPPS;
}

export function saveOpportunities(items: SalesOpportunity[]) {
  saveJson(OPP_KEY, items);
}

export function addOpportunity(input: Omit<SalesOpportunity, "id" | "createdAt">): SalesOpportunity {
  const opp: SalesOpportunity = { ...input, id: newId("opp"), createdAt: nowIso() };
  saveOpportunities([opp, ...loadOpportunities()]);
  return opp;
}

export function isSalesLive(): boolean {
  return loadJson(LIVE_KEY, false);
}

export function setSalesLive(live: boolean) {
  saveJson(LIVE_KEY, live);
}

export function computeSalesMetrics(): SalesMetrics {
  const opps = loadOpportunities();
  const live = isSalesLive();
  const verified = opps.filter((o) => o.hasVerifiedAmount && o.amount != null);
  const won = verified.filter((o) => o.stage === "won");
  const open = opps.filter((o) => o.stage !== "won" && o.stage !== "lost");

  if (!live && verified.length === 0) {
    return {
      mode: "DEMO",
      pipelineValue: null,
      closedRevenue: null,
      recurringRevenue: null,
      winRate: null,
      avgDealSize: null,
      leadCount: opps.filter((o) => o.stage === "lead").length,
      opportunityCount: open.length,
      note: "No connected or manually verified revenue data. Enter deal amounts or connect payments/CRM for real numbers.",
    };
  }

  const pipelineValue = open.reduce((s, o) => s + (o.amount ?? 0), 0);
  const closedRevenue =
    won.length > 0 ? won.reduce((s, o) => s + (o.amount ?? 0), 0) : null;
  const winRate =
    opps.filter((o) => o.stage === "won" || o.stage === "lost").length > 0
      ? Math.round((won.length / opps.filter((o) => o.stage === "won" || o.stage === "lost").length) * 100)
      : null;
  const avgDealSize = verified.length ? Math.round(verified.reduce((s, o) => s + (o.amount ?? 0), 0) / verified.length) : null;

  return {
    mode: live ? "LIVE" : "MANUAL",
    pipelineValue,
    closedRevenue,
    recurringRevenue: null,
    winRate,
    avgDealSize,
    leadCount: opps.filter((o) => o.stage === "lead").length,
    opportunityCount: open.length,
    note: live
      ? "Metrics from connected payments and CRM."
      : "Manual entry — connect Stripe or invoices for live revenue.",
  };
}
