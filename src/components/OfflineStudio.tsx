"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  enqueueOfflineChange,
  flushOfflineQueue,
  isForcedOffline,
  isOffline,
  loadOfflineCache,
  loadOfflineQueue,
  offlineSummary,
  refreshOfflineCache,
  setForcedOffline,
  type OfflineBundle,
  type OfflineQueueItem,
} from "@/lib/offline";
import { setSyncStatus } from "@/lib/sync-status";

export function OfflineStudio() {
  const [bundle, setBundle] = useState<OfflineBundle | null>(null);
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [forced, setForced] = useState(false);
  const [message, setMessage] = useState("");

  function refresh() {
    setBundle(loadOfflineCache());
    setQueue(loadOfflineQueue());
    setForced(isForcedOffline());
  }

  useEffect(() => {
    refreshOfflineCache();
    refresh();
  }, []);

  const summary = offlineSummary(bundle);

  return (
    <AppShell
      title="Offline support"
      subtitle="View calendar, tasks, notes, recent conversations, and important documents without internet — sync when you reconnect."
    >
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Status</span>
          <strong>{isOffline() ? "Offline" : "Online"}</strong>
          <small>{forced ? "Forced demo offline" : "Live network state"}</small>
        </div>
        <div className="stat">
          <span>Cached events</span>
          <strong>{summary.events}</strong>
          <small>Calendar</small>
        </div>
        <div className="stat">
          <span>Tasks / notes</span>
          <strong>
            {summary.tasks}/{summary.notes}
          </strong>
          <small>Available offline</small>
        </div>
        <div className="stat">
          <span>Queue</span>
          <strong>{queue.filter((q) => !q.synced).length}</strong>
          <small>Waiting to sync</small>
        </div>
      </div>

      <section className="panel">
        <h2>Offline controls</h2>
        <p className="panel-lead">
          Atlas keeps a local cache so basic information stays readable without a connection.
        </p>
        <div className="cta-row">
          <button
            type="button"
            className={`btn ${forced ? "btn-dark" : "btn-outline"}`}
            onClick={() => {
              const next = !forced;
              setForcedOffline(next);
              setForced(next);
              setMessage(next ? "Forced offline mode on." : "Back online.");
              refresh();
            }}
          >
            {forced ? "Go online" : "Simulate offline"}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              refreshOfflineCache();
              refresh();
              setSyncStatus("saved", "Offline cache refreshed.");
              setMessage("Cache refreshed from local data.");
            }}
          >
            Refresh cache
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              enqueueOfflineChange("Edited calendar event while offline", "event");
              refresh();
              setMessage("Queued an offline change.");
            }}
          >
            Queue offline change
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => {
              if (isOffline()) {
                setMessage("Still offline — reconnect or turn off forced offline first.");
                return;
              }
              const result = flushOfflineQueue();
              refresh();
              setMessage(`Synced ${result.count} change(s).`);
            }}
          >
            Sync now
          </button>
        </div>
        {summary.cachedAt ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Cache updated {new Date(summary.cachedAt).toLocaleString()}
          </p>
        ) : null}
      </section>

      <div className="split">
        <section className="panel">
          <h2>Available offline</h2>
          <ul className="manage-list">
            <li>
              <div>
                <strong>Calendar</strong>
                <span>{summary.events} events cached</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Tasks</strong>
                <span>{summary.tasks} tasks</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Saved notes</strong>
                <span>{summary.notes} captures</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Recent conversations</strong>
                <span>{summary.conversations} chats</span>
              </div>
            </li>
            <li>
              <div>
                <strong>Important documents</strong>
                <span>{summary.documents} files</span>
              </div>
            </li>
          </ul>
          {bundle?.calendar?.events.slice(0, 3).map((event) => (
            <p key={event.id} className="muted">
              · {event.title}
            </p>
          ))}
        </section>

        <section className="panel">
          <h2>Sync queue</h2>
          <ul className="manage-list">
            {queue.length ? (
              queue.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.label}</strong>
                    <span>
                      {item.synced ? "Synced" : "Pending"} · {new Date(item.at).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="muted">No queued changes.</li>
            )}
          </ul>
        </section>
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
