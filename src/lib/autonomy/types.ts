/** Atlas autonomy contract: routine company vs owner exceptions. */

export type AutonomyLevel = 1 | 2 | 3 | 4;

export type AutonomyBand = "routine" | "operational" | "restricted";

export type AutonomyVerdict = "execute" | "ask_owner" | "blocked";

export type AutonomyKind =
  | "schedule_appointment"
  | "send_confirmation"
  | "send_reminder"
  | "customer_follow_up"
  | "receptionist_call"
  | "basic_message"
  | "qualify_lead"
  | "assign_task"
  | "invoice_reminder"
  | "review_request"
  | "apply_discount"
  | "refund"
  | "fill_canceled_slot"
  | "marketing_spend"
  | "vendor_payment"
  | "payroll_change"
  | "fire_employee"
  | "sign_contract"
  | "file_taxes"
  | "take_loan"
  | "large_transfer"
  | "delete_company_data"
  | "change_ownership"
  | "change_security";

export type WorkIntent = {
  kind: AutonomyKind;
  title: string;
  summary: string;
  amountCents?: number;
  discountPercent?: number;
  payload?: Record<string, unknown>;
};

export type AutonomyPolicy = {
  organizationId: string;
  level: AutonomyLevel;
  killSwitch: boolean;
  autoPaymentLimitCents: number;
  refundLimitCents: number;
  discountCapPercent: number;
  marketingBudgetCents: number;
  earliestScheduleHour: number;
  wakeOnlyEmergencies: boolean;
  standingOrders: string[];
  updatedAt: string;
};

export type AutonomyDecision = {
  verdict: AutonomyVerdict;
  kind: AutonomyKind;
  band: AutonomyBand;
  title: string;
  summary: string;
  reason: string;
  amountCents?: number;
  limitCents?: number;
  ownerPrompt: string;
};

export const LEVEL_LABELS: Record<AutonomyLevel, { name: string; headline: string }> = {
  1: {
    name: "Assistant",
    headline: "Atlas recommends actions but does nothing without approval.",
  },
  2: {
    name: "Routine Autonomy",
    headline: "Atlas handles safe repetitive work. Exceptions still come to you.",
  },
  3: {
    name: "Business Manager",
    headline: "Atlas makes operational decisions inside the rules you set.",
  },
  4: {
    name: "Autopilot",
    headline: "Atlas runs the routine company. You only hear about exceptions.",
  },
};
