import type { NavItem } from "@/lib/atlas-platform";

export type IntelligenceFlowStep = NavItem & { step: number };

/** Connected Atlas flow — market signal through execution and health tracking. */
export const intelligenceFlowSteps: IntelligenceFlowStep[] = [
  {
    step: 1,
    label: "Market Intelligence detects signal",
    href: "/app/market-intelligence?tab=alerts",
  },
  {
    step: 2,
    label: "Business Engine calculates effect",
    href: "/app/business-engine?tab=overview",
  },
  {
    step: 3,
    label: "Simulator tests responses",
    href: "/app/business-engine?tab=simulate",
  },
  {
    step: 4,
    label: "CEO approves decision",
    href: "/app/approvals",
  },
  {
    step: 5,
    label: "Project Manager creates work",
    href: "/app/projects",
  },
  {
    step: 6,
    label: "Workforce assigns employees",
    href: "/app/workforce",
  },
  {
    step: 7,
    label: "Calendar schedules deadlines",
    href: "/app/appointments",
  },
  {
    step: 8,
    label: "Automations follow up",
    href: "/app/workflows",
  },
  {
    step: 9,
    label: "Business Health tracks results",
    href: "/app/business-engine?tab=health",
  },
];

export function simulateFlowHref(prompt: string, source = "market") {
  const params = new URLSearchParams({
    tab: "simulate",
    prompt,
    flow: source,
  });
  return `/app/business-engine?${params.toString()}`;
}

export function decisionFlowHref(prompt: string, source = "market") {
  const params = new URLSearchParams({
    tab: "decision",
    prompt,
    flow: source,
  });
  return `/app/business-engine?${params.toString()}`;
}
