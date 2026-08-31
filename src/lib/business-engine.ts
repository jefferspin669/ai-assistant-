/** Atlas Business Engine — company model, decisions, simulation, health, predictions. */

import { intelligenceScore, predictiveAlerts } from "@/lib/atlas-platform";
import { loadHealthScore } from "@/lib/ops-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty } from "@/lib/user-workspace";
import { workloadByMember } from "@/lib/projects-workspace";

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

export type CompanyModel = {
  revenue: string;
  expenses: string;
  cash: string;
  debt: string;
  customers: number;
  locations: number;
  employeeCount: number;
  leads: number;
  conversionRate: number;
  churn: number;
  pipeline: string;
  capacity: string;
  customNotes: string;
};

export type DecisionResult = {
  id: string;
  prompt: string;
  revenueBefore: string;
  revenueAfter: string;
  payrollBefore: string;
  payrollAfter: string;
  runwayBefore: string;
  runwayAfter: string;
  newCustomers: number;
  risk: string;
  confidence: number;
  why: string;
  createdAt: string;
};

export type SimulationAssumption = {
  id: string;
  label: string;
  enabled: boolean;
  value: string;
};

export type SimulationResult = {
  best: string;
  expected: string;
  worst: string;
  summary: string;
};

export type HealthMetric = {
  id: string;
  name: string;
  score: number;
  delta: number;
  custom?: boolean;
};

export type HealthAutomation = {
  id: string;
  trigger: string;
  action: string;
  enabled: boolean;
};

export type PredictionCard = {
  id: string;
  title: string;
  value: string;
  confidence: number;
  why: string;
  dataUsed: string[];
};

const MODEL_KEY = "atlas-business-model-v1";
const DECISIONS_KEY = "atlas-business-decisions-v1";
const METRICS_KEY = "atlas-health-metrics-v1";
const AUTO_KEY = "atlas-health-automations-v1";

export const DEFAULT_ASSUMPTIONS: SimulationAssumption[] = [
  { id: "churn", label: "Customer churn +3%", enabled: false, value: "+3%" },
  { id: "ads", label: "Advertising +$10,000", enabled: false, value: "$10k" },
  { id: "hire2", label: "Hire 2 employees", enabled: false, value: "2" },
  { id: "price", label: "Raise prices 8%", enabled: false, value: "8%" },
  { id: "location", label: "Open location", enabled: false, value: "1" },
  { id: "lose", label: "Lose biggest customer", enabled: false, value: "1" },
  { id: "slowdown", label: "Economic slowdown", enabled: false, value: "moderate" },
];

export const DEFAULT_AUTOMATIONS: HealthAutomation[] = [
  { id: "runway", trigger: "Cash runway below 6 months", action: "Alert CEO", enabled: true },
  { id: "churn", trigger: "Customer churn exceeds 8%", action: "Atlas investigates causes", enabled: true },
  { id: "health", trigger: "Business Health below 70", action: "Generate recovery plan", enabled: true },
  { id: "cyber", trigger: "Cybersecurity score below 80", action: "Notify administrator", enabled: true },
  { id: "pipeline", trigger: "Sales pipeline falls 20%", action: "Alert sales manager + review task", enabled: true },
];

export function loadCompanyModel(): CompanyModel {
  seedDemoTeamIfEmpty();
  const members = loadTeamMembers();
  const workload = workloadByMember();
  const openTasks = Object.values(workload).reduce((n, w) => n + w.open, 0);
  return loadJson(MODEL_KEY, {
    revenue: "$2.4M",
    expenses: "$1.62M",
    cash: "$890K",
    debt: "$120K",
    customers: 1842,
    locations: 2,
    employeeCount: members.length,
    leads: 248,
    conversionRate: 46,
    churn: 4.1,
    pipeline: "$420K",
    capacity: `${openTasks} open tasks · ${members.length} employees`,
    customNotes: "",
  });
}

export function saveCompanyModel(model: CompanyModel) {
  saveJson(MODEL_KEY, model);
}

export function loadDecisions(): DecisionResult[] {
  return loadJson(DECISIONS_KEY, []);
}

export function saveDecisions(items: DecisionResult[]) {
  saveJson(DECISIONS_KEY, items);
}

export function testDecision(prompt: string): DecisionResult {
  const lower = prompt.toLowerCase();
  const hireMatch = lower.match(/hire\s+(\d+)/);
  const count = hireMatch ? Number(hireMatch[1]) : lower.includes("sales") ? 5 : 2;
  const result: DecisionResult = {
    id: newId("dec"),
    prompt,
    revenueBefore: "$2.4M",
    revenueAfter: count >= 5 ? "$2.91M" : "$2.65M",
    payrollBefore: "$620K",
    payrollAfter: count >= 5 ? "$890K" : "$720K",
    runwayBefore: "17 months",
    runwayAfter: count >= 5 ? "12 months" : "14 months",
    newCustomers: count >= 5 ? 183 : 48,
    risk: count >= 5 ? "Moderate" : "Low",
    confidence: count >= 5 ? 76 : 68,
    why:
      count >= 5
        ? "Atlas expects additional sales capacity to increase lead conversion by ~14%, but payroll rises immediately while revenue ramps over ~4 months."
        : "Modest hiring improves capacity without severely compressing runway.",
    createdAt: nowIso(),
  };
  saveDecisions([result, ...loadDecisions()]);
  return result;
}

export function runSimulation(
  prompt: string,
  assumptions: SimulationAssumption[],
): SimulationResult {
  const enabled = assumptions.filter((a) => a.enabled);
  let best = 9;
  let expected = 9;
  let worst = -4;
  if (enabled.some((a) => a.id === "price")) {
    best += 8;
    expected += 9;
    worst -= 4;
  }
  if (enabled.some((a) => a.id === "churn") || enabled.some((a) => a.id === "lose")) {
    worst -= 6;
    expected -= 3;
  }
  if (enabled.some((a) => a.id === "hire2")) {
    expected -= 2;
    worst -= 5;
  }
  return {
    best: `+${best}% profit`,
    expected: `+${expected}% profit`,
    worst: `${worst}% profit`,
    summary: prompt.trim() || "Price increase scenario",
  };
}

export function loadHealthMetrics(): HealthMetric[] {
  const saved = loadJson<HealthMetric[]>(METRICS_KEY, []);
  if (saved.length) return saved;
  return [
    { id: "financial", name: "Financial Health", score: 88, delta: 4 },
    { id: "sales", name: "Sales", score: 79, delta: 2 },
    { id: "customers", name: "Customer Health", score: 84, delta: 1 },
    { id: "workforce", name: "Workforce", score: 72, delta: -6 },
    { id: "operations", name: "Operations", score: 86, delta: 2 },
    { id: "cyber", name: "Cybersecurity", score: 91, delta: 1 },
    { id: "market", name: "Market Position", score: 73, delta: 0 },
  ];
}

export function saveHealthMetrics(metrics: HealthMetric[]) {
  saveJson(METRICS_KEY, metrics);
}

export function addCustomHealthMetric(name: string): HealthMetric {
  const metric: HealthMetric = { id: newId("hm"), name, score: 75, delta: 0, custom: true };
  saveHealthMetrics([...loadHealthMetrics(), metric]);
  return metric;
}

export function healthMovements(): string[] {
  return [
    "↓ Workforce -6 — Four employees carry significantly higher workloads than their department average.",
    "↑ Financial +4 — Operating expenses decreased 7.2% while revenue remained stable.",
  ];
}

export function loadHealthAutomations(): HealthAutomation[] {
  const saved = loadJson<HealthAutomation[]>(AUTO_KEY, []);
  return saved.length ? saved : DEFAULT_AUTOMATIONS;
}

export function saveHealthAutomations(items: HealthAutomation[]) {
  saveJson(AUTO_KEY, items);
}

export function loadPredictions(): PredictionCard[] {
  return [
    {
      id: "rev",
      title: "Revenue",
      value: "$284K projected next month",
      confidence: 81,
      why: "Seasonal lift + stable conversion from Google Ads.",
      dataUsed: ["Invoices", "Pipeline", "12-month trend"],
    },
    {
      id: "churn",
      title: "Customer churn",
      value: "Expected 4.1% → 5.3%",
      confidence: 74,
      why: "Wait-time complaints correlated with churn in similar cohorts.",
      dataUsed: ["Support tickets", "Reviews", "Network benchmark"],
    },
    {
      id: "cash",
      title: "Cash runway",
      value: "~14 months at current spend",
      confidence: 79,
      why: "Payroll steady; marketing spend up 6%.",
      dataUsed: ["Banking", "Payroll", "Forecast model"],
    },
    {
      id: "staff",
      title: "Staffing",
      value: "Support capacity >90% in ~6 weeks",
      confidence: 70,
      why: "Open tasks rising faster than hiring.",
      dataUsed: ["Workforce", "Project Manager", "Schedules"],
    },
    ...predictiveAlerts.map((a, i) => ({
      id: `pa-${i}`,
      title: a.title,
      value: a.body.slice(0, 60),
      confidence: 65,
      why: a.body,
      dataUsed: ["Atlas predictive engine"],
    })),
  ];
}

export function simulateEmployeeScenario(prompt: string): string {
  seedDemoTeamIfEmpty();
  const members = loadTeamMembers();
  const lower = prompt.toLowerCase();
  if (lower.includes("sarah") && lower.includes("leave")) {
    return `If Sarah leaves, ${members.length - 1} staff remain. Atlas models -12% sales follow-up capacity and recommends cross-training Marcus on renewal accounts.`;
  }
  if (lower.includes("hire") && lower.includes("support")) {
    return "Three support hires add ~35% ticket capacity in 8 weeks; payroll +$14.2K/mo; churn risk drops ~1.2 pts.";
  }
  if (lower.includes("30% more customers")) {
    return `Current workforce can absorb ~18% more volume before SLA risk. Hiring 2 techs or extending shifts covers 30%.`;
  }
  if (lower.includes("5% raise")) {
    return "Company-wide 5% raise adds ~$31K/qtr payroll; runway shortens by ~1.5 months unless pricing adjusts +2%.";
  }
  return "Atlas modeled payroll, capacity, workload, and revenue effects using your shared Workforce records.";
}

export function overallHealthScore(): number {
  const saved = loadHealthScore(intelligenceScore.score);
  const metrics = loadHealthMetrics();
  const avg = metrics.reduce((s, m) => s + m.score, 0) / metrics.length;
  return Math.round((saved.score + avg) / 2);
}
