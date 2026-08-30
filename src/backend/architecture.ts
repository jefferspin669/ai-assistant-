/** Target Atlas backend. Next.js modules now; NestJS extract later if the API splits out. */

export const BACKEND_PHASES = [
  { id: 1, name: "Real data", work: "Supabase/Postgres → auth → orgs → customers → employees → appointments → tasks" },
  { id: 2, name: "Brain", work: "Atlas Brain → AI chat → business memory → tool calling" },
  { id: 3, name: "24/7 jobs", work: "Redis/BullMQ → workers → scheduled jobs → event system" },
  { id: 4, name: "Authority", work: "permissions → approvals → audit log" },
  { id: 5, name: "Outside world", work: "Twilio → Stripe → Google Calendar → email" },
  { id: 6, name: "Autopilot", work: "full automation builder + autonomous agents" },
] as const;

export const BACKEND_MODULES = [
  { id: "ai", path: "src/backend/ai", owns: "Atlas Brain pipeline — the only path to the model" },
  { id: "automation", path: "src/backend/automation", owns: "Event → conditions → jobs" },
  { id: "jobs", path: "src/backend/jobs", owns: "Queue contract (file today; BullMQ later)" },
  { id: "permissions", path: "src/backend/permissions", owns: "Action risk table: automatic vs owner approval" },
  { id: "audit", path: "src/backend/audit", owns: "Why did Atlas do that?" },
  { id: "events", path: "src/backend/events", owns: "Domain event bus" },
] as const;

export const NOT_YET = [
  "NestJS as a second HTTP server (Next.js route handlers stay the API)",
  "Kubernetes / Kafka / extra databases",
  "Calling OpenAI from the React client",
] as const;
