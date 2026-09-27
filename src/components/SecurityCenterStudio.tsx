"use client";

import Link from "@/components/SiteLink";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  APPROVED_AUTO_ACTIONS,
  applyDefensiveAction,
  bandLabel,
  computeSecurityScore,
  loadSecurityIncidents,
  mergeSecurityEvents,
  loadSecurityEvents,
  MONITORED_SIGNALS,
  type DefensiveAction,
  type SecurityEvent,
  type SecurityIncident,
} from "@/lib/security-center";
import {
  SECURITY_CENTER_TABS,
  resolveSecurityCenterTab,
} from "@/lib/intelligence-nav";

const ACTION_LABELS: Record<DefensiveAction, string> = {
  revoke_session: "Revoke session",
  disable_api_key: "Disable API key",
  lock_account: "Lock account",
  require_mfa: "Require MFA",
  pause_integration: "Pause integration",
  alert_admin: "Alert admin",
};

function bandClass(band: SecurityEvent["band"]) {
  if (band === "CRITICAL" || band === "HIGH") return "badge warn";
  if (band === "MEDIUM") return "badge";
  return "badge ok";
}

type TabId = (typeof SECURITY_CENTER_TABS)[number];

function isSecurityTab(value: string): value is TabId {
  return (SECURITY_CENTER_TABS as readonly string[]).includes(value);
}

function SecurityCenterStudioInner() {
  const searchParams = useSearchParams();
  const resolved = resolveSecurityCenterTab(searchParams.get("tab"));
  const tab: TabId = isSecurityTab(resolved) ? resolved : "activity";

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState("");
  const [ready, setReady] = useState(false);

  const refreshLocal = useCallback(() => {
    setIncidents(loadSecurityIncidents());
  }, []);

  useEffect(() => {
    void fetch("/api/security")
      .then((r) => r.json())
      .then((json: { ok: boolean; data?: { events: SecurityEvent[]; disclaimer?: string } }) => {
        if (json.ok && json.data) {
          const merged = mergeSecurityEvents(json.data.events);
          setEvents(merged);
          setSelectedId(merged[0]?.id ?? null);
          setDisclaimer(json.data.disclaimer ?? "");
        }
        refreshLocal();
        setReady(true);
      })
      .catch(() => {
        refreshLocal();
        setReady(true);
      });
  }, [refreshLocal]);

  const selected = events.find((e) => e.id === selectedId) ?? events[0];
  const openCount = useMemo(() => events.filter((e) => !e.resolved).length, [events]);
  const criticalCount = useMemo(
    () => events.filter((e) => !e.resolved && e.band === "CRITICAL").length,
    [events],
  );
  const securityScore = useMemo(() => computeSecurityScore(events), [events]);

  function runAction(action: DefensiveAction) {
    if (!selected) return;
    const incident = applyDefensiveAction(selected.id, action);
    setEvents(loadSecurityEvents());
    refreshLocal();
    setNote(
      incident
        ? `Defensive action applied — ${incident.timeline.length} timeline entries recorded.`
        : "Could not apply action.",
    );
  }

  return (
    <AppShell
      title="Atlas Security Center"
      subtitle="Threat monitoring, live activity, incidents, and pre-approved defensive response."
    >
      <div className="training-studio">
        <div className="stat-grid metrics-dense">
          <div className="stat"><span>Open signals</span><strong>{openCount}</strong></div>
          <div className="stat"><span>Critical</span><strong>{criticalCount}</strong></div>
          <div className="stat"><span>Security score</span><strong>{securityScore}</strong></div>
          <div className="stat"><span>Incidents</span><strong>{incidents.length}</strong></div>
        </div>

        {disclaimer ? (
          <div className="memory-card">
            <div className="label">Honest security posture</div>
            <p>{disclaimer}</p>
          </div>
        ) : null}

        {note ? (
          <div className="memory-card">
            <div className="label">Atlas</div>
            <p>{note}</p>
          </div>
        ) : null}

        {tab === "threats" ? (
          <section className="panel">
            <h2>Threat categories Atlas watches</h2>
            <ul className="plain-list">
              {MONITORED_SIGNALS.map((s) => (
                <li key={s.kind}>{s.label}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {tab === "activity" ? (
          <div className="split">
            <section className="panel">
              <h2>Live activity</h2>
              {!ready ? <p className="muted-line">Syncing…</p> : null}
              <div className="list">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    className={selectedId === ev.id ? "compliance-row active" : "compliance-row"}
                    onClick={() => setSelectedId(ev.id)}
                  >
                    <span className={bandClass(ev.band)}>{ev.band} — {ev.riskScore}</span>
                    <div>
                      <p><strong>{ev.title}</strong></p>
                      <small className="muted-line">{ev.detail}</small>
                    </div>
                  </button>
                ))}
              </div>
            </section>
            <section className="panel">
              {selected ? (
                <>
                  <h2>{selected.title}</h2>
                  <p className="panel-lead">{bandLabel(selected.band)}</p>
                  <p>{selected.detail}</p>
                  {!selected.resolved ? (
                    <div className="cta-row" style={{ marginTop: "0.75rem" }}>
                      {APPROVED_AUTO_ACTIONS.map((action) => (
                        <button key={action} className="btn btn-outline" type="button" onClick={() => runAction(action)}>
                          {ACTION_LABELS[action]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="badge ok">{selected.autoAction ?? "Resolved"}</p>
                  )}
                </>
              ) : null}
            </section>
          </div>
        ) : null}

        {tab === "incidents" ? (
          <section className="panel">
            <h2>Incidents</h2>
            {incidents.length === 0 ? (
              <p className="panel-lead">No contained incidents yet. Apply a defensive action from Live Activity.</p>
            ) : (
              incidents.map((inc) => (
                <div key={inc.id} style={{ marginBottom: "1.5rem" }}>
                  <h3>{inc.title}</h3>
                  <div className="timeline">
                    {inc.timeline.map((entry) => (
                      <div className="timeline-item" key={entry.id}>
                        <strong>{entry.at}</strong>
                        <p className="muted-line">{entry.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        ) : null}

        {tab === "score" ? (
          <section className="panel">
            <h2>Security score: {securityScore}/100</h2>
            <p className="panel-lead">
              Derived from open signal severity. Cybersecurity also appears in Business Engine health ({91} typical when secure).
            </p>
            <Link className="btn btn-outline" href="/app/business-engine?tab=health">View in Business Health</Link>
          </section>
        ) : null}

        {tab === "rules" ? (
          <section className="panel">
            <h2>Response rules</h2>
            <p className="panel-lead">Pre-approved defensive actions Atlas may run when owners enable auto-response.</p>
            <ul className="plain-list">
              {APPROVED_AUTO_ACTIONS.map((action) => (
                <li key={action}>{ACTION_LABELS[action]}</li>
              ))}
            </ul>
            <p className="muted-line" style={{ marginTop: "0.75rem" }}>
              Cross-Atlas automations (health triggers, follow-ups) live in{" "}
              <Link href="/app/workflows">Automations</Link>.
            </p>
          </section>
        ) : null}

        {tab === "audit" ? (
          <section className="panel">
            <h2>Audit log</h2>
            <p className="panel-lead">
              Full sensitive-action audit trail — sessions, exports, permission changes, and defensive responses.
            </p>
            <Link className="btn btn-dark" href="/app/access">Open Audit Log</Link>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export function SecurityCenterStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading Security Center…</p>}>
      <SecurityCenterStudioInner />
    </Suspense>
  );
}
