/** Atlas is an autonomous AI OS: it runs routine operations; the owner controls strategy and high-risk decisions. */

export const ATLAS_PRODUCT =
  "Atlas is an autonomous AI operating system that runs the routine operations of a business, while the owner controls strategy and high-risk decisions.";

export type AutonomyLevelId = "assistant" | "automate" | "manager" | "autopilot";

export type AtlasRuntimeState = {
  level: AutonomyLevelId;
  paused: boolean;
  away: boolean;
  awayStartedAt: string | null;
  awayReportDismissed: boolean;
  agentsActive: number;
  automationsRunning: number;
  tasksCompletedToday: number;
};

export type AutonomyLevelDef = {
  id: AutonomyLevelId;
  name: string;
  headline: string;
  spendLimit: number | null;
  refundLimit: number | null;
  can: string[];
  mustAsk: string[];
};

export const AUTONOMY_LEVELS: AutonomyLevelDef[] = [
  {
    id: "assistant",
    name: "Assistant",
    headline: "Atlas recommends. You approve every action.",
    spendLimit: null,
    refundLimit: null,
    can: ["Draft replies", "Prepare the schedule", "Flag overdue invoices", "Brief you each morning"],
    mustAsk: ["Scheduling", "Customer messages", "Invoices", "Refunds", "Employee changes", "Any payment"],
  },
  {
    id: "automate",
    name: "Automate",
    headline: "Atlas handles safe repetitive work. Exceptions still come to you.",
    spendLimit: 0,
    refundLimit: 0,
    can: ["Schedule customers", "Send confirmations", "Follow up with leads", "Send invoice reminders"],
    mustAsk: ["Refunds", "Any payment", "Employee discipline", "Contracts", "Pricing changes"],
  },
  {
    id: "manager",
    name: "Manager",
    headline: "Atlas runs operations inside the limits you set.",
    spendLimit: 250,
    refundLimit: 100,
    can: [
      "Schedule customers",
      "Follow up with leads",
      "Send invoices",
      "Assign employees",
      "Resolve routine cancellations",
      "Spend up to $250",
    ],
    mustAsk: [
      "Refunds above $100",
      "Payments above $250",
      "Employee discipline",
      "Contracts",
      "Major pricing changes",
    ],
  },
  {
    id: "autopilot",
    name: "Autopilot",
    headline: "Atlas runs the routine company. You only hear about exceptions.",
    spendLimit: 500,
    refundLimit: 100,
    can: [
      "All Manager work",
      "Overnight booking and waitlist fills",
      "Invoice collection",
      "Spend up to $500",
    ],
    mustAsk: ["Emergencies", "Payments above $500", "Legal issues", "Employee termination", "Contracts"],
  },
];

export const AWAY_POLICY = {
  spendLimit: 500,
  refundLimit: 100,
  automatic: [
    "Routine operations",
    "Scheduling",
    "Customer communication",
    "Employee assignments",
    "Invoice collection",
  ],
  contactFor: ["emergencies", "payments > $500", "legal issues", "employee termination"],
};

export const AWAY_REPORT = [
  { label: "customers contacted", value: 13 },
  { label: "appointments booked", value: 5 },
  { label: "cancellation replaced", value: 1 },
  { label: "invoices collected", value: 7 },
  { label: "revenue processed", value: "$3,410" },
  { label: "customer messages answered", value: 26 },
  { label: "decision waiting for you", value: 1 },
];

const STORAGE_KEY = "atlas-runtime-v1";

export const DEFAULT_RUNTIME: AtlasRuntimeState = {
  level: "manager",
  paused: false,
  away: false,
  awayStartedAt: null,
  awayReportDismissed: true,
  agentsActive: 6,
  automationsRunning: 14,
  tasksCompletedToday: 37,
};

export function levelDef(id: AutonomyLevelId): AutonomyLevelDef {
  return AUTONOMY_LEVELS.find((row) => row.id === id) || AUTONOMY_LEVELS[2];
}

export function runtimeStatusLabel(state: AtlasRuntimeState) {
  if (state.paused) return "Paused";
  if (state.away) return "Running the business";
  return "Live";
}

export function loadAtlasRuntime(): AtlasRuntimeState {
  if (typeof window === "undefined") return { ...DEFAULT_RUNTIME };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_RUNTIME };
    const parsed = JSON.parse(raw) as Partial<AtlasRuntimeState>;
    const level = AUTONOMY_LEVELS.some((row) => row.id === parsed.level) ? parsed.level : DEFAULT_RUNTIME.level;
    return { ...DEFAULT_RUNTIME, ...parsed, level: level as AutonomyLevelId };
  } catch {
    return { ...DEFAULT_RUNTIME };
  }
}

export function saveAtlasRuntime(state: AtlasRuntimeState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function setAutonomyLevel(state: AtlasRuntimeState, level: AutonomyLevelId): AtlasRuntimeState {
  return { ...state, level };
}

export function pauseAtlas(state: AtlasRuntimeState, paused: boolean): AtlasRuntimeState {
  return { ...state, paused, away: paused ? false : state.away };
}

export function startOwnerAway(state: AtlasRuntimeState): AtlasRuntimeState {
  return {
    ...state,
    paused: false,
    away: true,
    awayStartedAt: new Date().toISOString(),
    awayReportDismissed: true,
  };
}

export function returnFromAway(state: AtlasRuntimeState): AtlasRuntimeState {
  return {
    ...state,
    away: false,
    awayReportDismissed: false,
  };
}

export function dismissAwayReport(state: AtlasRuntimeState): AtlasRuntimeState {
  return { ...state, awayReportDismissed: true, awayStartedAt: null };
}
