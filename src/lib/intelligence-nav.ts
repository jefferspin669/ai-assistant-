import type { NavItem } from "@/lib/atlas-platform";

export type IntelligenceHub = {
  id: string;
  label: string;
  baseHref: string;
  items: NavItem[];
};

/** Sidebar intelligence hubs — single source for hub sub-nav. */
export const intelligenceHubs: IntelligenceHub[] = [
  {
    id: "business-engine",
    label: "Business Engine",
    baseHref: "/app/business-engine",
    items: [
      { href: "/app/business-engine?tab=overview", label: "Overview" },
      { href: "/app/business-engine?tab=health", label: "Health Score" },
      { href: "/app/business-engine?tab=predictions", label: "Predictions" },
      { href: "/app/business-engine?tab=simulate", label: "Simulator" },
      { href: "/app/business-engine?tab=decision", label: "Decisions" },
      { href: "/app/business-engine?tab=scenarios", label: "Scenarios" },
      { href: "/app/business-engine?tab=recommendations", label: "Recommendations" },
    ],
  },
  {
    id: "market-intelligence",
    label: "Market Intelligence",
    baseHref: "/app/market-intelligence",
    items: [
      { href: "/app/market-intelligence?tab=competitors", label: "Competitors" },
      { href: "/app/market-intelligence?tab=industry", label: "Industry" },
      { href: "/app/market-intelligence?tab=signals", label: "Market Signals" },
      { href: "/app/market-intelligence?tab=alerts", label: "Alerts" },
      { href: "/app/market-intelligence?tab=feed", label: "Intelligence Feed" },
    ],
  },
  {
    id: "security-center",
    label: "Security Center",
    baseHref: "/app/security-center",
    items: [
      { href: "/app/security-center?tab=threats", label: "Threats" },
      { href: "/app/security-center?tab=activity", label: "Live Activity" },
      { href: "/app/security-center?tab=incidents", label: "Incidents" },
      { href: "/app/security-center?tab=score", label: "Security Score" },
      { href: "/app/security-center?tab=rules", label: "Response Rules" },
      { href: "/app/security-center?tab=audit", label: "Audit Log" },
    ],
  },
];

export const automationsNavItem: NavItem = {
  href: "/app/workflows",
  label: "Automations",
};

export const intelligencePinnedPaths = new Set([
  ...intelligenceHubs.map((hub) => hub.baseHref),
  automationsNavItem.href,
]);

/** Match sidebar sub-item including ?tab= query params. */
export function isIntelligenceNavItemActive(pathname: string, search: string, item: NavItem): boolean {
  const [path, query] = item.href.split("?");
  if (pathname !== path) return false;
  const current = new URLSearchParams(search);
  if (!query) return current.toString() === "";
  const expected = new URLSearchParams(query);
  if (!current.get("tab")) {
    const defaultTab =
      path === "/app/business-engine"
        ? "overview"
        : path === "/app/market-intelligence"
          ? "competitors"
          : path === "/app/security-center"
            ? "activity"
            : null;
    if (defaultTab && expected.get("tab") === defaultTab) return true;
  }
  for (const [key, value] of expected.entries()) {
    if (current.get(key) !== value) return false;
  }
  return true;
}

export function intelligenceHubIsActive(pathname: string, search: string, hub: IntelligenceHub): boolean {
  if (pathname !== hub.baseHref) return false;
  return hub.items.some((item) => isIntelligenceNavItemActive(pathname, search, item));
}

export function resolveBusinessEngineTab(raw: string | null): string {
  const aliases: Record<string, string> = {
    model: "overview",
    simulator: "simulate",
    decisions: "decision",
  };
  const tab = raw ?? "overview";
  return aliases[tab] ?? tab;
}

export const BUSINESS_ENGINE_TABS = [
  "overview",
  "health",
  "predictions",
  "simulate",
  "decision",
  "scenarios",
  "recommendations",
] as const;

export function resolveMarketIntelligenceTab(raw: string | null): string {
  const tab = raw ?? "competitors";
  return tab;
}

export const MARKET_INTELLIGENCE_TABS = ["competitors", "industry", "signals", "alerts", "feed"] as const;

export function resolveSecurityCenterTab(raw: string | null): string {
  const tab = raw ?? "activity";
  return tab;
}

export const SECURITY_CENTER_TABS = ["threats", "activity", "incidents", "score", "rules", "audit"] as const;
