/** Atlas Security Center — defensive monitoring, risk scoring, and incident response. */

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

export type RiskBand = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecurityEventKind =
  | "login_location"
  | "failed_login"
  | "permission_change"
  | "api_activity"
  | "database_query"
  | "mass_export"
  | "data_deletion"
  | "employee_behavior"
  | "api_key"
  | "traffic_spike"
  | "webhook"
  | "integration_alert"
  | "financial_change";

export type SecurityEvent = {
  id: string;
  kind: SecurityEventKind;
  title: string;
  detail: string;
  riskScore: number;
  band: RiskBand;
  source: "backend" | "integration" | "atlas";
  at: string;
  resolved: boolean;
  autoAction?: string;
};

export type IncidentTimelineEntry = {
  id: string;
  at: string;
  text: string;
};

export type SecurityIncident = {
  id: string;
  title: string;
  status: "open" | "contained" | "closed";
  events: string[];
  timeline: IncidentTimelineEntry[];
  createdAt: string;
};

export type DefensiveAction =
  | "revoke_session"
  | "disable_api_key"
  | "lock_account"
  | "require_mfa"
  | "pause_integration"
  | "alert_admin";

const EVENTS_KEY = "atlas-security-events-v1";
const INCIDENTS_KEY = "atlas-security-incidents-v1";

export function riskBand(score: number): RiskBand {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

export function bandLabel(band: RiskBand): string {
  switch (band) {
    case "CRITICAL":
      return "CRITICAL — immediate response recommended";
    case "HIGH":
      return "HIGH — potential compromise";
    case "MEDIUM":
      return "MEDIUM — needs investigation";
    default:
      return "LOW — unusual but often benign";
  }
}

export function loadSecurityEvents(): SecurityEvent[] {
  return loadJson(EVENTS_KEY, []);
}

export function saveSecurityEvents(events: SecurityEvent[]) {
  saveJson(EVENTS_KEY, events);
}

export function loadSecurityIncidents(): SecurityIncident[] {
  return loadJson(INCIDENTS_KEY, []);
}

export function saveSecurityIncidents(items: SecurityIncident[]) {
  saveJson(INCIDENTS_KEY, items);
}

export function mergeSecurityEvents(incoming: SecurityEvent[]): SecurityEvent[] {
  const existing = loadSecurityEvents();
  const ids = new Set(existing.map((e) => e.id));
  const merged = [...incoming.filter((e) => !ids.has(e.id)), ...existing];
  saveSecurityEvents(merged.slice(0, 100));
  return merged;
}

export function applyDefensiveAction(eventId: string, action: DefensiveAction): SecurityIncident | null {
  const events = loadSecurityEvents();
  const event = events.find((e) => e.id === eventId);
  if (!event) return null;

  const actionLabel: Record<DefensiveAction, string> = {
    revoke_session: "Account session revoked",
    disable_api_key: "API key disabled",
    lock_account: "Account locked",
    require_mfa: "MFA required on next login",
    pause_integration: "Integration paused",
    alert_admin: "CEO and security administrators notified",
  };

  const now = new Date();
  const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const timeline: IncidentTimelineEntry[] = [
    { id: newId("tl"), at: time, text: event.title },
    ...(action === "alert_admin"
      ? []
      : [{ id: newId("tl"), at: time, text: `Atlas ${actionLabel[action].toLowerCase()}` }]),
    { id: newId("tl"), at: time, text: actionLabel.alert_admin },
  ];

  const incident: SecurityIncident = {
    id: newId("inc"),
    title: event.title,
    status: "contained",
    events: [eventId],
    timeline,
    createdAt: nowIso(),
  };

  saveSecurityIncidents([incident, ...loadSecurityIncidents()]);
  saveSecurityEvents(events.map((e) => (e.id === eventId ? { ...e, resolved: true, autoAction: actionLabel[action] } : e)));
  return incident;
}

export const MONITORED_SIGNALS: { kind: SecurityEventKind; label: string }[] = [
  { kind: "login_location", label: "Unusual login locations or devices" },
  { kind: "failed_login", label: "Repeated failed logins" },
  { kind: "permission_change", label: "Privilege / permission changes" },
  { kind: "api_activity", label: "Suspicious API activity" },
  { kind: "database_query", label: "Abnormal database queries" },
  { kind: "mass_export", label: "Mass downloads / exports" },
  { kind: "data_deletion", label: "Unexpected business data deletion" },
  { kind: "employee_behavior", label: "Unusual employee behavior" },
  { kind: "api_key", label: "Compromised API keys" },
  { kind: "traffic_spike", label: "Sudden traffic spikes" },
  { kind: "webhook", label: "Suspicious webhook activity" },
  { kind: "integration_alert", label: "Malware / security alerts from connected services" },
  { kind: "financial_change", label: "Unusual financial or account changes" },
];

export const APPROVED_AUTO_ACTIONS: DefensiveAction[] = [
  "revoke_session",
  "disable_api_key",
  "lock_account",
  "require_mfa",
  "pause_integration",
  "alert_admin",
];
