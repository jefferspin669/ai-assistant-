export type { AutonomyDecision, AutonomyKind, AutonomyLevel, AutonomyPolicy, WorkIntent } from "@/lib/autonomy/types";
export { LEVEL_LABELS } from "@/lib/autonomy/types";
export { decideWork, isAwayPhrase, levelFromAwayPhrase } from "@/lib/autonomy/engine";
export {
  formatUsd,
  kindLabel,
  bandFor,
  isAutonomyKind,
  RESTRICTED_KINDS,
  ROUTINE_KINDS,
  OPERATIONAL_KINDS,
  ALL_KINDS,
} from "@/lib/autonomy/catalog";
export {
  getPolicy,
  patchPolicy,
  applyAwayMode,
  savePolicy,
  appendStandingOrder,
} from "@/lib/autonomy/policy";
export {
  submitWork,
  demoVendorPayment,
  intentFromAtlasAction,
  pendingAutonomyCards,
  askAtlasAboutApproval,
} from "@/lib/autonomy/submit";
export { processAutonomyQueue } from "@/lib/autonomy/worker";
export {
  AUTO_PERMISSION_DEFS,
  CONTROL_MODE_LABELS,
  controlModeToLevel,
  defaultPermissionsForMode,
  levelToControlMode,
  mergeAutoPermissions,
  type AutoPermissionKey,
  type ControlMode,
} from "@/lib/autonomy/permissions";
