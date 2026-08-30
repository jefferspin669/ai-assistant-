import { registerAutomationHandlers } from "@/backend/automation/engine";

registerAutomationHandlers();

export { BACKEND_MODULES, BACKEND_PHASES, NOT_YET } from "@/backend/architecture";
export { emitEvent, onEvent, recentEvents } from "@/backend/events/bus";
export type { AtlasEvent, AtlasEventType } from "@/backend/events/types";
export { addJob, drainQueue, queueDriver } from "@/backend/jobs/queue";
export { authorizeAction } from "@/backend/permissions/engine";
export { DEFAULT_ACTION_POLICIES } from "@/backend/permissions/policies";
export { runBrainPipeline, BRAIN_STEPS } from "@/backend/ai/pipeline";
export { formatActivityLine, listActivity, recordActivity } from "@/backend/audit/activity";
export { registerAutomationHandlers } from "@/backend/automation/engine";
