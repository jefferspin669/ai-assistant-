import type { AutonomyKind, AutonomyPolicy } from "@/lib/autonomy/types";

export type AutoPermissionKey =
  | "scheduling"
  | "follow_ups"
  | "task_creation"
  | "reminders"
  | "customer_replies"
  | "inventory_reorders"
  | "marketing_actions";

export type ControlMode = "manual" | "assisted" | "autonomous";

export type AutoPermissionDef = {
  key: AutoPermissionKey;
  label: string;
  description: string;
  kinds: AutonomyKind[];
};

export const AUTO_PERMISSION_DEFS: AutoPermissionDef[] = [
  {
    key: "scheduling",
    label: "Scheduling",
    description: "Book, move, and fill calendar slots.",
    kinds: ["schedule_appointment", "fill_canceled_slot"],
  },
  {
    key: "follow_ups",
    label: "Follow-ups",
    description: "Lead nurture and customer follow-up sequences.",
    kinds: ["customer_follow_up", "qualify_lead"],
  },
  {
    key: "task_creation",
    label: "Task creation",
    description: "Create and assign work from Atlas actions.",
    kinds: ["assign_task"],
  },
  {
    key: "reminders",
    label: "Reminders",
    description: "Appointment confirmations and reminder texts.",
    kinds: ["send_reminder", "send_confirmation", "invoice_reminder"],
  },
  {
    key: "customer_replies",
    label: "Routine customer replies",
    description: "Receptionist calls and basic customer messages.",
    kinds: ["basic_message", "receptionist_call"],
  },
  {
    key: "inventory_reorders",
    label: "Inventory reorders",
    description: "Routine vendor payments and stock reorders within limits.",
    kinds: ["vendor_payment"],
  },
  {
    key: "marketing_actions",
    label: "Marketing actions",
    description: "Review requests and marketing spend inside budget.",
    kinds: ["marketing_spend", "review_request"],
  },
];

export const DEFAULT_AUTO_PERMISSIONS: Record<AutoPermissionKey, boolean> = {
  scheduling: true,
  follow_ups: true,
  task_creation: true,
  reminders: true,
  customer_replies: false,
  inventory_reorders: false,
  marketing_actions: false,
};

export const ASSISTED_AUTO_PERMISSIONS: Record<AutoPermissionKey, boolean> = {
  scheduling: true,
  follow_ups: true,
  task_creation: true,
  reminders: true,
  customer_replies: false,
  inventory_reorders: false,
  marketing_actions: false,
};

export const AUTONOMOUS_AUTO_PERMISSIONS: Record<AutoPermissionKey, boolean> = {
  scheduling: true,
  follow_ups: true,
  task_creation: true,
  reminders: true,
  customer_replies: true,
  inventory_reorders: true,
  marketing_actions: true,
};

export const CONTROL_MODE_LABELS: Record<
  ControlMode,
  { name: string; headline: string; level: AutonomyPolicy["level"] }
> = {
  manual: {
    name: "Manual",
    headline: "Atlas suggests actions — you approve everything.",
    level: 1,
  },
  assisted: {
    name: "Assisted",
    headline: "Atlas handles routine work and asks before higher-impact actions.",
    level: 2,
  },
  autonomous: {
    name: "Autonomous",
    headline: "Atlas executes approved categories within the limits you set.",
    level: 3,
  },
};

export function levelToControlMode(level: AutonomyPolicy["level"]): ControlMode {
  if (level <= 1) return "manual";
  if (level <= 2) return "assisted";
  return "autonomous";
}

export function controlModeToLevel(mode: ControlMode): AutonomyPolicy["level"] {
  return CONTROL_MODE_LABELS[mode].level;
}

export function defaultPermissionsForMode(mode: ControlMode): Record<AutoPermissionKey, boolean> {
  if (mode === "manual") return { ...DEFAULT_AUTO_PERMISSIONS, scheduling: false, follow_ups: false, task_creation: false, reminders: false };
  if (mode === "assisted") return { ...ASSISTED_AUTO_PERMISSIONS };
  return { ...AUTONOMOUS_AUTO_PERMISSIONS };
}

export function permissionKeyForKind(kind: AutonomyKind): AutoPermissionKey | null {
  for (const def of AUTO_PERMISSION_DEFS) {
    if (def.kinds.includes(kind)) return def.key;
  }
  return null;
}

export function kindAllowedByPermissions(kind: AutonomyKind, policy: AutonomyPolicy): boolean {
  const key = permissionKeyForKind(kind);
  if (!key) return true;
  return Boolean(policy.autoPermissions?.[key]);
}

export function mergeAutoPermissions(
  base: Record<AutoPermissionKey, boolean> | undefined,
  patch: Partial<Record<AutoPermissionKey, boolean>> | undefined,
): Record<AutoPermissionKey, boolean> {
  const merged = { ...DEFAULT_AUTO_PERMISSIONS, ...base };
  if (!patch) return merged;
  for (const def of AUTO_PERMISSION_DEFS) {
    if (typeof patch[def.key] === "boolean") merged[def.key] = patch[def.key]!;
  }
  return merged;
}
