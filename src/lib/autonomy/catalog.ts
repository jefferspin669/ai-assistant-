import type { AutonomyBand, AutonomyKind, AutonomyLevel } from "@/lib/autonomy/types";

export const ROUTINE_KINDS: AutonomyKind[] = [
  "schedule_appointment",
  "send_confirmation",
  "send_reminder",
  "customer_follow_up",
  "receptionist_call",
  "basic_message",
  "qualify_lead",
  "assign_task",
  "invoice_reminder",
  "review_request",
];

export const OPERATIONAL_KINDS: AutonomyKind[] = [
  "apply_discount",
  "refund",
  "fill_canceled_slot",
  "marketing_spend",
  "vendor_payment",
];

/** Never auto-execute, at any level. Owner can still Approve. */
export const RESTRICTED_KINDS: AutonomyKind[] = [
  "payroll_change",
  "fire_employee",
  "sign_contract",
  "file_taxes",
  "take_loan",
  "large_transfer",
  "delete_company_data",
  "change_ownership",
  "change_security",
];

export const ALL_KINDS: AutonomyKind[] = [
  ...ROUTINE_KINDS,
  ...OPERATIONAL_KINDS,
  ...RESTRICTED_KINDS,
];

export function bandFor(kind: AutonomyKind): AutonomyBand {
  if ((RESTRICTED_KINDS as string[]).includes(kind)) return "restricted";
  if ((OPERATIONAL_KINDS as string[]).includes(kind)) return "operational";
  return "routine";
}

export function minLevelForBand(band: AutonomyBand): AutonomyLevel {
  if (band === "routine") return 2;
  if (band === "operational") return 3;
  return 4;
}

export function kindLabel(kind: AutonomyKind): string {
  return kind.replace(/_/g, " ");
}

export function isAutonomyKind(value: string): value is AutonomyKind {
  return (ALL_KINDS as string[]).includes(value);
}

export function formatUsd(cents: number): string {
  const whole = cents % 100 === 0;
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
