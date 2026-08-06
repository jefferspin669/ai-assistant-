"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  RISKY_ACTION_CATALOG,
  addCustomConfirmation,
  clearResolvedConfirmations,
  hydrateConfirmations,
  loadConfirmations,
  pendingCount,
  queueCatalogAction,
  removeConfirmation,
  resolveConfirmation,
  type PendingConfirmation,
  type RiskyActionKind,
} from "@/lib/confirmations";
import { setSyncStatus } from "@/lib/sync-status";

export function ConfirmationStudio() {
  const [items, setItems] = useState<PendingConfirmation[]>([]);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<PendingConfirmation | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [impact, setImpact] = useState("");

  function refresh(preferredId?: string) {
    const next = loadConfirmations();
    setItems(next);
    setSelected((prev) => {
      const id = preferredId || prev?.id;
      return (
        (id ? next.find((i) => i.id === id) : null) ||
        next.find((i) => i.status === "pending") ||
        next[0] ||
        null
      );
    });
  }

  useEffect(() => {
    let cancelled = false;
    void hydrateConfirmations().then((next) => {
      if (cancelled) return;
      setItems(next);
      setSelected(next.find((i) => i.status === "pending") || next[0] || null);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function queue(kind: RiskyActionKind) {
    const item = queueCatalogAction(kind);
    refresh(item.id);
    setSyncStatus("action_pending", `Confirm “${item.title}” before Atlas continues.`);
    setMessage(`Queued “${item.title}” — waiting for your confirmation.`);
  }

  function decide(approved: boolean) {
    if (!selected) return;
    const result = resolveConfirmation(selected.id, approved);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setSyncStatus(approved ? "action_completed" : "saved", result.item.resultNote || undefined);
    setMessage(result.item.resultNote || "");
    refresh(result.item.id);
  }

  function onAddCustom(e: FormEvent) {
    e.preventDefault();
    const item = addCustomConfirmation({ title, summary, details, impact });
    setTitle("");
    setSummary("");
    setDetails("");
    setImpact("");
    refresh(item.id);
    setSyncStatus("action_pending", `Confirm “${item.title}” before Atlas continues.`);
    setMessage(`Added “${item.title}” to the confirmation queue.`);
  }

  const pending = items.filter((i) => i.status === "pending");

  return (
    <AppShell
      title="Confirmation system"
      subtitle="Atlas never runs risky actions immediately — review, confirm, cancel, or add your own checks."
    >
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Pending</span>
          <strong>{pendingCount(items)}</strong>
          <small>Awaiting your approval</small>
        </div>
        <div className="stat">
          <span>Approved</span>
          <strong>{items.filter((i) => i.status === "approved").length}</strong>
          <small>Completed safely</small>
        </div>
        <div className="stat">
          <span>Cancelled</span>
          <strong>{items.filter((i) => i.status === "cancelled").length}</strong>
          <small>Stopped in time</small>
        </div>
        <div className="stat">
          <span>Catalog</span>
          <strong>{RISKY_ACTION_CATALOG.length}</strong>
          <small>Risky action types</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Queue a risky action</h2>
          <p className="panel-lead">These require an explicit yes before Atlas proceeds.</p>
          <ul className="manage-list">
            {RISKY_ACTION_CATALOG.map((action) => (
              <li key={action.kind}>
                <div>
                  <strong>{action.title}</strong>
                  <span>{action.summary}</span>
                </div>
                <button type="button" className="btn btn-outline" onClick={() => queue(action.kind)}>
                  Request
                </button>
              </li>
            ))}
          </ul>

          <h3 style={{ marginTop: "1.1rem" }}>Add your own confirmation</h3>
          <form className="form-grid" onSubmit={onAddCustom}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Refund customer" />
            </label>
            <label>
              What will happen
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                required
                placeholder="Issue a $240 refund to Elena Brooks"
              />
            </label>
            <label>
              Details (one per line)
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={"Amount: $240\nMethod: original card"}
              />
            </label>
            <label>
              Impact
              <input
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                placeholder="Money leaves Stripe balance after approval"
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Add to queue
            </button>
          </form>
        </section>

        <section className="panel confirm-review">
          <h2>Review before it happens</h2>
          {selected ? (
            <>
              <p className="briefing-kicker">
                {selected.status === "pending" ? "Needs confirmation" : selected.status} · {selected.requestedBy}
              </p>
              <h3>{selected.title}</h3>
              <p className="confirm-prompt">{selected.summary}</p>
              <ul className="confirm-details">
                {selected.details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <div className="confirm-impact">
                <strong>Impact</strong>
                <p>{selected.impact}</p>
              </div>
              {selected.status === "pending" ? (
                <div className="cta-row" style={{ marginTop: "1rem" }}>
                  <button type="button" className="btn btn-dark" onClick={() => decide(true)}>
                    Confirm and continue
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => decide(false)}>
                    Cancel action
                  </button>
                </div>
              ) : (
                <p className={selected.status === "approved" ? "auth-success" : "auth-error"}>
                  {selected.resultNote}
                </p>
              )}
            </>
          ) : (
            <p className="panel-lead">Queue an action or add your own to preview the confirmation screen.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="train-head">
          <div>
            <h2>Confirmation history</h2>
          </div>
          {items.some((i) => i.status !== "pending") ? (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                clearResolvedConfirmations();
                refresh();
                setMessage("Cleared resolved confirmations.");
              }}
            >
              Clear resolved
            </button>
          ) : null}
        </div>
        <ul className="manage-list">
          {items.length ? (
            items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>
                    [{item.status}] {item.title}
                  </strong>
                  <span>
                    {item.summary} · {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="cta-row">
                  <button type="button" className="btn btn-outline" onClick={() => setSelected(item)}>
                    Check
                  </button>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => {
                      removeConfirmation(item.id);
                      refresh();
                      setMessage(`Removed “${item.title}”.`);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          ) : (
            <li className="muted">No confirmations yet.</li>
          )}
        </ul>
        {pending.length ? (
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            {pending.length} action{pending.length === 1 ? "" : "s"} still waiting.
          </p>
        ) : null}
      </section>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
