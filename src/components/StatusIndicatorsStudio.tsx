"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { pendingCount } from "@/lib/confirmations";
import { connectionStats } from "@/lib/connections";
import {
  STATUS_LABELS,
  loadStatusHistory,
  runSaveCycle,
  setSyncStatus,
  subscribeSyncStatus,
  type SyncStatusEvent,
  type SyncStatusKind,
} from "@/lib/sync-status";

const KINDS = Object.keys(STATUS_LABELS) as SyncStatusKind[];

export function StatusIndicatorsStudio() {
  const [current, setCurrent] = useState<SyncStatusEvent | null>(null);
  const [history, setHistory] = useState<SyncStatusEvent[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    return subscribeSyncStatus((event) => {
      setCurrent(event);
      setHistory(loadStatusHistory());
    });
  }, []);

  return (
    <AppShell
      title="Status & sync"
      subtitle="Never leave users guessing — Saved, Saving, Synced, Offline, Connection failed, Action pending, Action completed, Needs attention."
    >
      <section className="panel">
        <p className="briefing-kicker">Current state</p>
        <h2>{current?.label || "—"}</h2>
        <p className="panel-lead">{current?.detail}</p>
        <div className="status-chip-row">
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className={`status-chip status-chip-${kind}${current?.kind === kind ? " active" : ""}`}
              onClick={() => {
                setSyncStatus(kind);
                setMessage(`Status set to ${STATUS_LABELS[kind]}.`);
              }}
            >
              {STATUS_LABELS[kind]}
            </button>
          ))}
        </div>
        <div className="cta-row" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="btn btn-dark"
            onClick={async () => {
              await runSaveCycle("Calendar event");
              setMessage("Save cycle finished — users saw Saving → Saved → Synced.");
            }}
          >
            Demo save cycle
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSyncStatus("action_pending", `${pendingCount()} confirmation(s) waiting.`);
              setMessage("Action pending reflected from confirmation queue.");
            }}
          >
            Reflect pending actions
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              const stats = connectionStats();
              setSyncStatus(
                stats.attention ? "needs_attention" : "connection_failed",
                stats.attention
                  ? `${stats.attention} connection(s) need attention.`
                  : "A connection attempt failed.",
              );
            }}
          >
            Reflect connections
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Recent status history</h2>
        <ul className="manage-list">
          {history.length ? (
            history.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <span>
                    {item.detail} · {new Date(item.at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <li className="muted">Status changes will appear here.</li>
          )}
        </ul>
      </section>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
