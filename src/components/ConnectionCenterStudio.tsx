"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  connectionStats,
  connectService,
  disconnectService,
  hydrateConnections,
  syncService,
  type ServiceConnection,
} from "@/lib/connections";

function healthLabel(health: ServiceConnection["health"]) {
  switch (health) {
    case "healthy":
      return "Healthy";
    case "syncing":
      return "Syncing";
    case "needs_attention":
      return "Needs attention";
    default:
      return "Disconnected";
  }
}

export function ConnectionCenterStudio() {
  const [connections, setConnections] = useState<ServiceConnection[]>([]);
  const [message, setMessage] = useState("");
  const [accountDraft, setAccountDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    void hydrateConnections().then((next) => {
      if (!cancelled) setConnections(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = connectionStats(connections);

  function refresh(next: ServiceConnection[], note: string) {
    setConnections(next);
    setMessage(note);
  }

  return (
    <AppShell
      title="Connection center"
      subtitle="Manage Google, Microsoft, Stripe, banks, QuickBooks, and the rest of your stack in one place."
    >
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Connected</span>
          <strong>
            {stats.connected}/{stats.total}
          </strong>
          <small>Active integrations</small>
        </div>
        <div className="stat">
          <span>Needs attention</span>
          <strong>{stats.attention}</strong>
          <small>Re-auth or sync issues</small>
        </div>
        <div className="stat">
          <span>Last touch</span>
          <strong>
            {connections
              .filter((c) => c.lastSyncAt)
              .sort((a, b) => (b.lastSyncAt || "").localeCompare(a.lastSyncAt || ""))[0]
              ?.name || "—"}
          </strong>
          <small>Most recent sync</small>
        </div>
        <div className="stat">
          <span>Categories</span>
          <strong>7</strong>
          <small>Identity → storage</small>
        </div>
      </div>

      <section className="panel">
        <h2>Connect an account</h2>
        <div className="form-grid" style={{ maxWidth: 420 }}>
          <label>
            Account email / label
            <input
              value={accountDraft}
              onChange={(e) => setAccountDraft(e.target.value)}
              placeholder="you@business.com"
            />
          </label>
        </div>
      </section>

      <div className="connection-grid">
        {connections.map((conn) => (
          <article key={conn.id} className={`connection-card ${conn.connected ? "connected" : ""}`}>
            <header>
              <div>
                <p className="briefing-kicker">{conn.category}</p>
                <h3>{conn.name}</h3>
              </div>
              <span className={`badge ${conn.health === "healthy" ? "ok" : conn.health === "needs_attention" ? "warn" : ""}`}>
                {healthLabel(conn.health)}
              </span>
            </header>
            <p>{conn.detail}</p>
            <dl className="connection-meta">
              <div>
                <dt>Connected account</dt>
                <dd>{conn.accountLabel || "Not connected"}</dd>
              </div>
              <div>
                <dt>Last synchronization</dt>
                <dd>{conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString() : "—"}</dd>
              </div>
              <div>
                <dt>Permissions granted</dt>
                <dd>{conn.permissions.join(" · ")}</dd>
              </div>
              <div>
                <dt>Connection health</dt>
                <dd>{healthLabel(conn.health)}</dd>
              </div>
            </dl>
            <div className="cta-row">
              {conn.connected ? (
                <>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => refresh(syncService(conn.id), `Synced ${conn.name}.`)}
                  >
                    Sync now
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => refresh(disconnectService(conn.id), `Disconnected ${conn.name}.`)}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() =>
                    refresh(
                      connectService(conn.id, accountDraft || undefined),
                      `Connected ${conn.name}.`,
                    )
                  }
                >
                  Connect
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
