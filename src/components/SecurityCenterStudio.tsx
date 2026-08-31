"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  APPROVED_AUTO_ACTIONS,
  applyDefensiveAction,
  bandLabel,
  loadSecurityIncidents,
  mergeSecurityEvents,
  loadSecurityEvents,
  MONITORED_SIGNALS,
  type DefensiveAction,
  type SecurityEvent,
  type SecurityIncident,
} from "@/lib/security-center";

const ACTION_LABELS: Record<DefensiveAction, string> = {
  revoke_session: "Revoke session",
  disable_api_key: "Disable API key",
  lock_account: "Lock account",
  require_mfa: "Require MFA",
  pause_integration: "Pause integration",
  alert_admin: "Alert admin",
};

function bandClass(band: SecurityEvent["band"]) {
  if (band === "CRITICAL") return "badge warn";
  if (band === "HIGH") return "badge warn";
  if (band === "MEDIUM") return "badge";
  return "badge ok";
}

export function SecurityCenterStudio() {
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

  function runAction(action: DefensiveAction) {
    if (!selected) return;
    const incident = applyDefensiveAction(selected.id, action);
    setEvents(loadSecurityEvents());
    refreshLocal();
    setNote(
      incident
        ? `Defensive action applied. Incident timeline recorded with ${incident.timeline.length} entries.`
        : "Could not apply action.",
    );
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Open signals</span>
          <strong>{openCount}</strong>
          <small>From live backend</small>
        </div>
        <div className="stat">
          <span>Critical</span>
          <strong>{criticalCount}</strong>
          <small>Immediate review</small>
        </div>
        <div className="stat">
          <span>Incidents</span>
          <strong>{incidents.length}</strong>
          <small>Contained responses</small>
        </div>
        <div className="stat">
          <span>Monitors</span>
          <strong>{MONITORED_SIGNALS.length}</strong>
          <small>Signal types</small>
        </div>
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

      <div className="split">
        <section className="panel">
          <h2>Live security events</h2>
          <p className="panel-lead">Connected to Atlas backend health, queue, and audit signals.</p>
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
              <p className="muted-line">Source: {selected.source} · {new Date(selected.at).toLocaleString()}</p>
              {selected.resolved ? (
                <p className="badge ok">{selected.autoAction ?? "Resolved"}</p>
              ) : (
                <div className="cta-row" style={{ marginTop: "0.75rem" }}>
                  {APPROVED_AUTO_ACTIONS.map((action) => (
                    <button key={action} className="btn btn-outline" type="button" onClick={() => runAction(action)}>
                      {ACTION_LABELS[action]}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </section>
      </div>

      {incidents[0] ? (
        <section className="panel">
          <h2>Incident timeline · {incidents[0].title}</h2>
          <div className="timeline">
            {incidents[0].timeline.map((entry) => (
              <div className="timeline-item" key={entry.id}>
                <strong>{entry.at}</strong>
                <p className="muted-line">{entry.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>What Atlas watches</h2>
        <ul className="plain-list">
          {MONITORED_SIGNALS.map((s) => (
            <li key={s.kind}>{s.label}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
