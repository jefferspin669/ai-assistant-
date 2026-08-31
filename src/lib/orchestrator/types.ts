export type CapabilityStatus = "AVAILABLE" | "DISCONNECTED" | "UNAVAILABLE" | "SIMULATED";
export type ApprovalNeed = "none" | "conditional" | "REQUIRED";
export type WorkerLane = "ai" | "email" | "sms" | "payment" | "calendar" | "automation" | "maintenance";

export type Capability = {
  id: string;
  label: string;
  provider: string;
  permission: string | null;
  approval: ApprovalNeed;
  status: CapabilityStatus;
  lane: WorkerLane;
  detail: string;
};

export type BusinessRuleId =
  | "refund_needs_approval"
  | "quiet_hours"
  | "discount_cap"
  | "job_deposit"
  | "auto_payment_limit"
  | "earliest_schedule";

export type RuleVerdict = {
  id: BusinessRuleId | string;
  ok: boolean;
  needsApproval: boolean;
  reason: string;
};

export type PlanStepKind =
  | "find_customer"
  | "find_invoice"
  | "inspect"
  | "choose_channel"
  | "draft"
  | "evaluate_rules"
  | "approval"
  | "invoke"
  | "wait"
  | "check_payment"
  | "escalate"
  | "compensate";

export type RunStepStatus = "pending" | "running" | "done" | "waiting" | "failed" | "skipped" | "blocked";

export type PlannedStep = {
  id: string;
  kind: PlanStepKind;
  label: string;
  capability?: string;
  compensate?: string;
  waitHours?: number;
  payload?: Record<string, unknown>;
};

export type RunStep = PlannedStep & {
  status: RunStepStatus;
  result?: Record<string, unknown>;
  error?: string;
  waitUntil?: string;
};

export type OrchestratorRun = {
  id: string;
  organizationId: string;
  userId: string;
  goal: string;
  intent: string;
  status: "running" | "waiting" | "blocked" | "completed" | "failed" | "compensating";
  steps: RunStep[];
  cursor: number;
  saga: { compensated: boolean; undone: string[] };
  traceId: string;
  createdAt: string;
  updatedAt: string;
};

export type TraceSpan = {
  name: string;
  ok: boolean;
  startedAt: string;
  endedAt: string;
  ms: number;
  detail?: string;
};

export type AtlasTrace = {
  id: string;
  organizationId: string;
  runId?: string;
  goal?: string;
  spans: TraceSpan[];
  totalMs: number;
  costUsd: number;
  tokens: number;
  actions: number;
  retries: number;
  createdAt: string;
};
