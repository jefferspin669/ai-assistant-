export const WORKSPACE_DOMAINS = [
  "tasks",
  "tax",
  "calendar",
  "connections",
  "confirmations",
  "feedback",
  "feedback-prefs",
  "contacts",
  "notes",
  "dashboard-layout",
] as const;

export type WorkspaceDomain = (typeof WORKSPACE_DOMAINS)[number];

export function isWorkspaceDomain(value: string): value is WorkspaceDomain {
  return (WORKSPACE_DOMAINS as readonly string[]).includes(value);
}
