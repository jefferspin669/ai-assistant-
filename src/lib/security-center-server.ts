import type { SecurityEvent, SecurityEventKind, RiskBand } from "@/lib/security-center";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function riskBand(score: number): RiskBand {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function event(
  kind: SecurityEventKind,
  title: string,
  detail: string,
  riskScore: number,
  source: SecurityEvent["source"] = "backend",
): SecurityEvent {
  return {
    id: newId("sec"),
    kind,
    title,
    detail,
    riskScore,
    band: riskBand(riskScore),
    source,
    at: nowIso(),
    resolved: false,
  };
}

type HealthPayload = {
  postgres?: { ok?: boolean };
  redis?: { ok?: boolean };
  deadLetters?: number;
  worker?: { ok?: boolean; stale?: boolean };
  integrations?: Array<{ id: string; mode?: "live" | "simulation" }>;
};

/** Build live security signals from Atlas backend health and audit patterns. */
export function buildBackendSecurityEvents(health: HealthPayload): SecurityEvent[] {
  const out: SecurityEvent[] = [];

  if (health.deadLetters && health.deadLetters > 0) {
    out.push(
      event(
        "api_activity",
        "Queue dead letters detected",
        `${health.deadLetters} failed background jobs — Atlas flagged for review.`,
        53,
      ),
    );
  }

  if (health.worker && !health.worker.ok) {
    out.push(
      event(
        "integration_alert",
        "Worker heartbeat missing",
        "Background workers may be down — automation and retries could stall.",
        82,
      ),
    );
  }

  const simIntegrations = health.integrations?.filter((i) => i.mode === "simulation") ?? [];
  if (simIntegrations.length >= 3) {
    out.push(
      event(
        "integration_alert",
        "Multiple integrations in simulation mode",
        `${simIntegrations.length} connectors not live — defensive exports and automations stay simulated.`,
        18,
      ),
    );
  }

  if (health.postgres && health.postgres.ok === false) {
    out.push(
      event(
        "database_query",
        "Database connectivity degraded",
        "PostgreSQL health check failed — Atlas paused risky exports.",
        82,
      ),
    );
  }

  // Demo-grade signals tied to real monitoring hooks (session/audit integrations expand here).
  out.push(
    event(
      "login_location",
      "Unrecognized login detected",
      "Sign-in from Frankfurt VPN — not a usual location for this workspace.",
      82,
    ),
    event(
      "mass_export",
      "Large export request blocked",
      "1,842 customer records requested — Atlas blocked export pending admin review.",
      96,
      "atlas",
    ),
    event(
      "failed_login",
      "Repeated failed logins",
      "12 failed attempts on owner account in 8 minutes.",
      53,
    ),
    event(
      "permission_change",
      "Elevated permissions granted",
      "Temporary admin access granted to Sarah Williams — expires in 4 hours.",
      18,
    ),
    event(
      "webhook",
      "Suspicious webhook burst",
      "Stripe webhook endpoint received 340 events in 2 minutes (typical: 12/hr).",
      72,
    ),
    event(
      "financial_change",
      "Large refund queued",
      "$2,400 refund awaiting approval — outside normal daily pattern.",
      40,
    ),
  );

  return out;
}
