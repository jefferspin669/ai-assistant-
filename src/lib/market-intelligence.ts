/** Atlas Market Intelligence — competitor profiles, timeline, and competitive alerts. */

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

export type Competitor = {
  id: string;
  name: string;
  website: string;
  addedAt: string;
};

export type TimelineCategory =
  | "pricing"
  | "product"
  | "hiring"
  | "expansion"
  | "marketing"
  | "news"
  | "reviews"
  | "website";

export type CompetitorTimelineEntry = {
  id: string;
  competitorId: string;
  competitorName: string;
  category: TimelineCategory;
  at: string;
  label: string;
  detail: string;
  analysis: string;
};

export type AlertPreference = {
  id: TimelineCategory;
  label: string;
  enabled: boolean;
};

export type CompetitiveAlert = {
  id: string;
  competitorName: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
  analysis: string;
  simulatePrompt: string;
  at: string;
};

const COMPETITORS_KEY = "atlas-competitors-v1";
const PREFS_KEY = "atlas-competitor-alert-prefs-v1";

export const DEFAULT_ALERT_PREFERENCES: AlertPreference[] = [
  { id: "pricing", label: "Pricing changes", enabled: true },
  { id: "product", label: "New products", enabled: true },
  { id: "hiring", label: "Hiring", enabled: true },
  { id: "expansion", label: "Expansion", enabled: true },
  { id: "marketing", label: "Marketing campaigns", enabled: true },
  { id: "news", label: "News", enabled: true },
  { id: "reviews", label: "Reviews", enabled: true },
  { id: "website", label: "Website changes", enabled: true },
];

const SEED_COMPETITORS: Competitor[] = [
  { id: "comp-a", name: "Competitor A", website: "competitor-a.com", addedAt: nowIso() },
  { id: "comp-b", name: "Competitor B", website: "competitor-b.com", addedAt: nowIso() },
  { id: "comp-c", name: "Competitor C", website: "competitor-c.com", addedAt: nowIso() },
];

const SEED_TIMELINE: CompetitorTimelineEntry[] = [
  {
    id: "tl-1",
    competitorId: "comp-a",
    competitorName: "Competitor A",
    category: "pricing",
    at: nowIso(),
    label: "Today",
    detail: "Professional plan: $149 → $129/month",
    analysis: "13% price cut may pressure SMB renewals; your pricing remains competitive for enterprise tiers.",
  },
  {
    id: "tl-2",
    competitorId: "comp-b",
    competitorName: "Competitor B",
    category: "hiring",
    at: new Date(Date.now() - 3 * 86400000).toISOString(),
    label: "3 days ago",
    detail: "Posted 12 openings for sales representatives",
    analysis: "Signals aggressive pipeline build — watch for outbound campaigns in your core zip codes.",
  },
  {
    id: "tl-3",
    competitorId: "comp-c",
    competitorName: "Competitor C",
    category: "expansion",
    at: new Date(Date.now() - 7 * 86400000).toISOString(),
    label: "7 days ago",
    detail: "Announced a new Chicago location",
    analysis: "Geographic overlap with two of your service areas within 18 months.",
  },
];

export function loadCompetitors(): Competitor[] {
  const saved = loadJson<Competitor[]>(COMPETITORS_KEY, []);
  return saved.length ? saved : SEED_COMPETITORS;
}

export function saveCompetitors(items: Competitor[]) {
  saveJson(COMPETITORS_KEY, items);
}

export function addCompetitor(name: string, website: string): Competitor {
  const competitor: Competitor = {
    id: newId("comp"),
    name: name.trim(),
    website: website.trim(),
    addedAt: nowIso(),
  };
  saveCompetitors([competitor, ...loadCompetitors()]);
  return competitor;
}

export function loadCompetitorTimeline(): CompetitorTimelineEntry[] {
  return SEED_TIMELINE;
}

export function loadAlertPreferences(): AlertPreference[] {
  const saved = loadJson<AlertPreference[]>(PREFS_KEY, []);
  if (!saved.length) return DEFAULT_ALERT_PREFERENCES;
  return DEFAULT_ALERT_PREFERENCES.map((pref) => {
    const match = saved.find((s) => s.id === pref.id);
    return match ? { ...pref, enabled: match.enabled } : pref;
  });
}

export function saveAlertPreferences(prefs: AlertPreference[]) {
  saveJson(PREFS_KEY, prefs);
}

export function loadCompetitiveAlerts(): CompetitiveAlert[] {
  const prefs = loadAlertPreferences();
  const pricingOn = prefs.find((p) => p.id === "pricing")?.enabled;
  if (!pricingOn) return [];

  return [
    {
      id: "alert-1",
      competitorName: "Competitor A",
      severity: "high",
      title: "Competitive Alert",
      detail: "Competitor A reduced pricing approximately 13%.",
      analysis:
        "Your Business Engine estimates your current pricing remains competitive, although SMB customers may become more price-sensitive.",
      simulatePrompt:
        "Competitor A cut Professional plan 13%. What if we match pricing vs hold margins?",
      at: nowIso(),
    },
  ];
}

export function categoryLabel(category: TimelineCategory): string {
  const pref = DEFAULT_ALERT_PREFERENCES.find((p) => p.id === category);
  return pref?.label ?? category;
}

export function loadIndustryInsights(): { industry: string; insight: string; signal: string }[] {
  return [
    { industry: "HVAC", signal: "Demand", insight: "Emergency call volume up 8% in Midwest — storm season pull-forward." },
    { industry: "SMB SaaS", signal: "Pricing", insight: "Median SMB software pricing rose 4.2% YoY; discounting compressed in Q2." },
    { industry: "Field services", signal: "Labor", insight: "Technician wages +5.1% regionally; overtime hours elevated on north routes." },
  ];
}

export function loadMarketSignals(): CompetitorTimelineEntry[] {
  return loadCompetitorTimeline().filter((e) => e.category === "pricing" || e.category === "hiring");
}

export function loadIntelligenceFeed(): Array<{ id: string; title: string; body: string; at: string }> {
  const timeline = loadCompetitorTimeline();
  const alerts = loadCompetitiveAlerts();
  return [
    ...alerts.map((a) => ({
      id: a.id,
      title: a.title,
      body: `${a.detail} — ${a.analysis}`,
      at: a.at,
    })),
    ...timeline.map((t) => ({
      id: t.id,
      title: `${t.competitorName}: ${categoryLabel(t.category)}`,
      body: t.detail,
      at: t.at,
    })),
  ];
}
