"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  addCustomConnection,
  connectionStats,
  connectService,
  disconnectService,
  loadConnections,
  removeConnection,
  syncService,
  updateConnection,
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

const CATEGORIES: ServiceConnection["category"][] = [
  "identity",
  "payments",
  "banking",
  "accounting",
  "commerce",
  "comms",
  "storage",
];

export function ConnectionCenterStudio() {
  const [connections, setConnections] = useState<ServiceConnection[]>([]);
  const [message, setMessage] = useState("");
  const [accountDraft, setAccountDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDetail, setEditDetail] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<ServiceConnection["category"]>("comms");
  const [newDetail, setNewDetail] = useState("");

  useEffect(() => {
    setConnections(loadConnections());
  }, []);

  const stats = connectionStats(connections);

  function refresh(next: ServiceConnection[], note: string) {
    setConnections(next);
    setMessage(note);
  }

  function startEdit(conn: ServiceConnection) {
    setEditingId(conn.id);
    setEditLabel(conn.accountLabel || "");
    setEditDetail(conn.detail);
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    refresh(
      updateConnection(editingId, {
        accountLabel: editLabel,
        detail: editDetail,
        health: editLabel.trim() ? "healthy" : undefined,
      }),
      "Connection updated.",
    );
    setEditingId(null);
  }

  function onAddCustom(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    refresh(
      addCustomConnection({
        name: newName,
        category: newCategory,
        detail: newDetail,
        accountLabel: accountDraft || undefined,
        connect: true,
      }),
      `Added “${newName.trim()}”.`,
    );
    setNewName("");
    setNewDetail("");
  }

  return (
    <AppShell
      title="Connection center"
      subtitle="Add, change, sync, or disconnect Google, Microsoft, Stripe, banks, and custom services."
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
          <strong>{CATEGORIES.length}</strong>
          <small>Identity → storage</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Connect an account</h2>
          <div className="form-grid">
            <label>
              Default account email / label
              <input
                value={accountDraft}
                onChange={(e) => setAccountDraft(e.target.value)}
                placeholder="you@business.com"
              />
            </label>
          </div>
          <p className="account-hint">Used when you Connect a service or add a custom one.</p>
        </section>

        <section className="panel">
          <h2>Add a custom connection</h2>
          <form className="form-grid" onSubmit={onAddCustom}>
            <label>
              Service name
              <input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Jobber" />
            </label>
            <label>
              Category
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ServiceConnection["category"])}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label>
              What it does
              <input
                value={newDetail}
                onChange={(e) => setNewDetail(e.target.value)}
                placeholder="Field service jobs and invoices"
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Add connection
            </button>
          </form>
        </section>
      </div>

      <div className="connection-grid">
        {connections.map((conn) => (
          <article key={conn.id} className={`connection-card ${conn.connected ? "connected" : ""}`}>
            <header>
              <div>
                <p className="briefing-kicker">{conn.category}</p>
                <h3>{conn.name}</h3>
              </div>
              <span
                className={`badge ${conn.health === "healthy" ? "ok" : conn.health === "needs_attention" ? "warn" : ""}`}
              >
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

            {editingId === conn.id ? (
              <form className="form-grid" onSubmit={saveEdit} style={{ marginTop: "0.75rem" }}>
                <label>
                  Account label
                  <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
                </label>
                <label>
                  Detail
                  <input value={editDetail} onChange={(e) => setEditDetail(e.target.value)} />
                </label>
                <div className="cta-row">
                  <button className="btn btn-dark" type="submit">
                    Save changes
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
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
                    <button type="button" className="btn btn-outline" onClick={() => startEdit(conn)}>
                      Change
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
                  <>
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
                    <button type="button" className="btn btn-outline" onClick={() => startEdit(conn)}>
                      Change
                    </button>
                  </>
                )}
                {conn.id.startsWith("custom-") ? (
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => refresh(removeConnection(conn.id), `Removed ${conn.name}.`)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            )}
          </article>
        ))}
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
