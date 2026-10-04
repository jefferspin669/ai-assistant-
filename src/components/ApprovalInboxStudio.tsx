"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/backend/client";

type ServerApproval = {
  id: string;
  action_type: string;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  payload: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
};

type LiveCard = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  ownerPrompt: string;
  band: string;
};

function titleFor(row: ServerApproval) {
  const payload = row.payload || {};
  const named = String(payload.title || payload.summary || payload.customerName || "");
  if (named) return named;
  return row.action_type.replace(/_/g, " ");
}

export function ApprovalInboxStudio() {
  const [rows, setRows] = useState<ServerApproval[]>([]);
  const [live, setLive] = useState<LiveCard[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [atlasReply, setAtlasReply] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    await fetch("/api/session").catch(() => undefined);
    const [approvals, autonomy] = await Promise.all([
      apiGet<ServerApproval[]>("/api/approvals"),
      apiGet<{ pending?: LiveCard[] }>("/api/autonomy"),
    ]);
    if (approvals.ok) setRows(approvals.data);
    else setError(approvals.error);
    if (autonomy.ok) setLive(autonomy.data.pending || []);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function decide(id: string, decision: "approved" | "rejected") {
    setBusyId(id);
    setFlash(null);
    const result = await apiSend("/api/approvals", "POST", { id, decision });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFlash(
      decision === "approved"
        ? "Approved on the server. Delivery still requires the action path to run (and an audit row)."
        : "Rejected on the server. Nothing was sent or paid.",
    );
    await refresh();
  }

  async function askLive(id: string) {
    const result = await apiSend<{ asked?: { reply?: string } }>("/api/autonomy/work", "POST", {
      askApprovalId: id,
    });
    setAtlasReply(
      result.ok
        ? String(result.data.asked?.reply || "Atlas is waiting on your call.")
        : result.error,
    );
  }

  const pending = rows.filter((row) => row.status === "pending");
  const decided = rows.filter((row) => row.status !== "pending").slice(0, 20);
  const liveIds = new Set(live.map((card) => card.id));
  const inbox = pending.filter((row) => !liveIds.has(row.id));

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Pending</span>
          <strong>{pending.length}</strong>
          <small>Server queue</small>
        </div>
        <div className="stat">
          <span>Autonomy cards</span>
          <strong>{live.length}</strong>
          <small>Same queue</small>
        </div>
        <div className="stat">
          <span>Resolved</span>
          <strong>{decided.length}</strong>
          <small>Recent</small>
        </div>
      </div>

      {error ? (
        <p role="alert" className="auth-error">
          {error}
        </p>
      ) : null}
      {flash ? (
        <p role="status" className="panel">
          {flash}
        </p>
      ) : null}

      {live.length ? (
        <section className="panel">
          <h2>Needs you — autonomy</h2>
          <p className="panel-lead">
            These cards are the same server approvals Atlas staged for permission checks.
          </p>
          <div className="list">
            {live.map((card) => (
              <div className="confirm-card" key={card.id} style={{ marginBottom: "0.8rem" }}>
                <div className="agent-tag">Live · {card.kind.replace(/_/g, " ")}</div>
                <pre className="muted-line" style={{ whiteSpace: "pre-wrap", margin: "0.4rem 0" }}>
                  {card.ownerPrompt || card.title}
                </pre>
                <div className="cta-row">
                  <button
                    className="btn btn-dark"
                    type="button"
                    disabled={busyId === card.id}
                    onClick={() => void decide(card.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    disabled={busyId === card.id}
                    onClick={() => void decide(card.id, "rejected")}
                  >
                    Reject
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => void askLive(card.id)}>
                    Ask Atlas
                  </button>
                </div>
              </div>
            ))}
          </div>
          {atlasReply ? <p className="muted-line">{atlasReply}</p> : null}
        </section>
      ) : null}

      <section className="panel">
        <h2>Server approvals</h2>
        <p className="panel-lead">
          One queue from <code>/api/approvals</code>. Browser-only approval lists are not shown here.
        </p>
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {ready && inbox.length === 0 && live.length === 0 ? (
          <p className="muted-line">No pending server approvals.</p>
        ) : (
          <div className="list">
            {inbox.map((row) => (
              <div className="list-row" key={row.id} style={{ alignItems: "flex-start" }}>
                <span className="badge warn">Pending</span>
                <div style={{ flex: 1 }}>
                  <p>
                    <strong>{titleFor(row)}</strong>
                  </p>
                  <p className="muted-line">
                    {row.action_type} · requested {new Date(row.created_at).toLocaleString()}
                  </p>
                  <div className="train-actions" style={{ marginTop: "0.4rem" }}>
                    <button
                      className="btn btn-dark"
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void decide(row.id, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void decide(row.id, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {decided.length ? (
        <section className="panel">
          <h2>Recently decided</h2>
          <div className="list">
            {decided.map((row) => (
              <div className="list-row" key={row.id}>
                <span className={row.status === "approved" ? "badge ok" : "badge warn"}>
                  {row.status}
                </span>
                <p>
                  <strong>{titleFor(row)}</strong>
                  <span className="muted-line"> · {row.action_type}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
