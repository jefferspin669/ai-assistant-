"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  RISKY_ACTION_CATALOG,
  loadConfirmations,
  pendingCount,
  queueCatalogAction,
  resolveConfirmation,
  type PendingConfirmation,
  type RiskyActionKind,
} from "@/lib/confirmations";
import { setSyncStatus } from "@/lib/sync-status";
import { actionPolicies } from "@/lib/section-hubs";

export function ConfirmationStudio() {
  const [items, setItems] = useState<PendingConfirmation[]>([]);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<PendingConfirmation | null>(null);

  function refresh() {
    const next = loadConfirmations();
    setItems(next);
    setSelected((prev) => next.find((i) => i.id === prev?.id) || next.find((i) => i.status === "pending") || next[0] || null);
  }

  useEffect(() => {
    refresh();
  }, []);

  function queue(kind: RiskyActionKind) {
    const item = queueCatalogAction(kind);
    refresh();
    setSelected(item);
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
    setSyncStatus(
      approved ? "action_completed" : "saved",
      result.item.resultNote || undefined,
    );
    setMessage(result.item.resultNote || "");
    refresh();
  }

  const pending = items.filter((i) => i.status === "pending");

  return (
    <AppShell
      title="Approvals"
      subtitle="One inbox for yes/no. Observe, suggest, approve, or automate — Atlas does not hide risky work in modules."
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

      <section className="panel" style={{ marginBottom: "1rem" }}>
        <h2>Observe · Suggest · Approve · Automate</h2>
        <p className="panel-lead">Each action has a stance. Atlas never treats “autonomous” as a single switch.</p>
        <div className="list">
          {actionPolicies.map((policy) => (
            <div className="list-row" key={policy.action}>
              <span className={`badge stance-${policy.stance.toLowerCase()}`}>{policy.stance}</span>
              <p>
                <strong>{policy.action}</strong>
                <span className="muted-line">{policy.note}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

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
            <p className="panel-lead">Queue an action to preview the confirmation screen.</p>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>Confirmation history</h2>
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
                <button type="button" className="btn btn-outline" onClick={() => setSelected(item)}>
                  View
                </button>
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
