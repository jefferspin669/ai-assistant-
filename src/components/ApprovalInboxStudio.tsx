"use client";

import { useCallback, useEffect, useState } from "react";
import {
  decideApprovalRequest,
  loadApprovalRequests,
  overrideApprovalRequest,
  recommendApproval,
  seedApprovalsIfEmpty,
  type ApprovalPriority,
  type ApprovalRequest,
} from "@/lib/surface-workspace";
import { logAudit } from "@/lib/user-workspace";

const PRIORITY_META: Record<ApprovalPriority, { label: string; dot: string; cls: string }> = {
  urgent: { label: "Urgent", dot: "🔴", cls: "badge warn" },
  normal: { label: "Normal", dot: "🟡", cls: "badge" },
  low: { label: "Low", dot: "🟢", cls: "badge ok" },
};

type LiveCard = {
  id: string;
  kind: string;
  title: string;
  summary: string;
  ownerPrompt: string;
  band: string;
};

export function ApprovalInboxStudio() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [live, setLive] = useState<LiveCard[]>([]);
  const [questionFor, setQuestionFor] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [overrideFor, setOverrideFor] = useState<string | null>(null);
  const [overrideText, setOverrideText] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [atlasReply, setAtlasReply] = useState<string | null>(null);

  const refresh = useCallback(() => setRequests(loadApprovalRequests()), []);

  const refreshLive = useCallback(async () => {
    try {
      await fetch("/api/session");
      const json = (await fetch("/api/autonomy").then((res) => res.json())) as {
        ok?: boolean;
        data?: { pending?: LiveCard[] };
      };
      if (json.ok && json.data?.pending) setLive(json.data.pending);
    } catch {
      /* demo still works from localStorage */
    }
  }, []);

  useEffect(() => {
    seedApprovalsIfEmpty();
    refresh();
    void refreshLive();
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("atlas-approval-requests")) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh, refreshLive]);

  function decide(req: ApprovalRequest, status: "approved" | "rejected") {
    decideApprovalRequest(req.id, status);
    logAudit("Manager", status === "approved" ? "approved request" : "rejected request", req.title);
    refresh();
    setFlash(`${status === "approved" ? "Approved" : "Rejected"}: ${req.title}.`);
  }

  function submitQuestion(req: ApprovalRequest) {
    decideApprovalRequest(req.id, "question", questionText);
    logAudit("Manager", "asked a question on", req.title);
    refresh();
    setQuestionFor(null);
    setQuestionText("");
    setFlash(`Question sent to ${req.requestedBy} about ${req.title}.`);
  }

  function submitOverride(req: ApprovalRequest) {
    const newStatus = req.status === "approved" ? "rejected" : "approved";
    overrideApprovalRequest(req.id, newStatus, overrideText);
    logAudit("CEO", `overrode decision to ${newStatus}`, `${req.title} — ${overrideText}`);
    refresh();
    setOverrideFor(null);
    setOverrideText("");
    setFlash(`CEO override recorded: ${req.title} is now ${newStatus}.`);
  }

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  async function decideLive(id: string, decision: "approved" | "rejected") {
    await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    await refreshLive();
    setFlash(`${decision === "approved" ? "Approved" : "Rejected"} live exception.`);
  }

  async function askLive(id: string) {
    const json = await fetch("/api/autonomy/work", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ askApprovalId: id }),
    }).then((res) => res.json());
    setAtlasReply(String(json.data?.asked?.reply || "Atlas is waiting on your call."));
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat"><span>Pending</span><strong>{pending.length + live.length}</strong><small>Awaiting you</small></div>
        <div className="stat"><span>Urgent</span><strong>{pending.filter((r) => r.priority === "urgent").length + live.length}</strong><small>Do first</small></div>
        <div className="stat"><span>Decided</span><strong>{decided.length}</strong><small>Recent</small></div>
      </div>

      {live.length ? (
        <section className="panel">
          <h2>Live — Atlas needs you</h2>
          <p className="panel-lead">Server-side permission engine. Approve, reject, or ask Atlas.</p>
          <div className="list">
            {live.map((card) => (
              <div className="confirm-card" key={card.id} style={{ marginBottom: "0.8rem" }}>
                <div className="agent-tag">Live · {card.kind.replace(/_/g, " ")}</div>
                <pre className="muted-line" style={{ whiteSpace: "pre-wrap", margin: "0.4rem 0" }}>
                  {card.ownerPrompt || card.title}
                </pre>
                <div className="cta-row">
                  <button className="btn btn-dark" type="button" onClick={() => void decideLive(card.id, "approved")}>
                    Approve
                  </button>
                  <button className="btn btn-outline" type="button" onClick={() => void decideLive(card.id, "rejected")}>
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
        <h2>Approvals</h2>
        <p className="panel-lead">Atlas prioritizes what needs you most.</p>
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {ready && pending.length === 0 ? (
          <p className="muted-line">You&apos;re all caught up — no pending approvals.</p>
        ) : (
          <div className="list">
            {pending.map((r) => {
              const meta = PRIORITY_META[r.priority];
              return (
                <div className="list-row" key={r.id} style={{ alignItems: "flex-start" }}>
                  <span className={meta.cls}>{meta.dot} {meta.label}</span>
                  <div style={{ flex: 1 }}>
                    <p><strong>{r.title}</strong></p>
                    <p className="muted-line">
                      Requested by {r.requestedBy}
                      {r.customer ? ` · Customer: ${r.customer}` : ""}
                      {r.reason ? ` · Reason: ${r.reason}` : ""}
                    </p>
                    {(() => {
                      const rec = recommendApproval(r);
                      return (
                        <div className="memory-card" style={{ marginTop: "0.4rem" }}>
                          <div className="label">🤖 Atlas Recommendation: {rec.verdict} · Confidence: {rec.confidence}</div>
                          {rec.reasons.map((reason, i) => <p key={i} style={{ margin: "0.1rem 0" }}>{reason}</p>)}
                          <p className="muted-line">You still decide.</p>
                        </div>
                      );
                    })()}
                    {questionFor === r.id ? (
                      <div style={{ marginTop: "0.4rem" }}>
                        <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={2} placeholder={`Ask ${r.requestedBy} a question…`} />
                        <div className="train-actions" style={{ marginTop: "0.3rem" }}>
                          <button className="btn btn-dark" type="button" onClick={() => submitQuestion(r)} disabled={!questionText.trim()}>Send question</button>
                          <button className="btn btn-outline" type="button" onClick={() => { setQuestionFor(null); setQuestionText(""); }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="train-actions" style={{ marginTop: "0.4rem" }}>
                        <button className="btn btn-dark" type="button" onClick={() => decide(r, "approved")}>Approve</button>
                        <button className="btn btn-outline" type="button" onClick={() => decide(r, "rejected")}>Reject</button>
                        <button className="btn btn-outline" type="button" onClick={() => { setQuestionFor(r.id); setQuestionText(""); }}>Ask Question</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {flash ? <p className="muted-line" style={{ marginTop: "0.6rem" }}>{flash}</p> : null}
      </section>

      {decided.length ? (
        <section className="panel">
          <h2>Recently decided</h2>
          <div className="list">
            {decided.map((r) => (
              <div className="list-row" key={r.id} style={{ alignItems: "flex-start" }}>
                <span className={r.status === "approved" ? "badge ok" : r.status === "rejected" ? "badge warn" : "badge"}>
                  {r.status === "approved" ? "Approved" : r.status === "rejected" ? "Rejected" : "Question"}
                </span>
                <div style={{ flex: 1 }}>
                  <p>
                    <strong>{r.title}</strong>
                    <span className="muted-line">by {r.requestedBy}{r.status === "question" && r.question ? ` · Asked: ${r.question}` : ""}{r.overrideReason ? ` · CEO override: ${r.overrideReason}` : ""}</span>
                  </p>
                  {overrideFor === r.id ? (
                    <div style={{ marginTop: "0.3rem" }}>
                      <textarea value={overrideText} onChange={(e) => setOverrideText(e.target.value)} rows={2} placeholder="Reason for override (e.g. Strategic customer relationship)" />
                      <div className="train-actions" style={{ marginTop: "0.3rem" }}>
                        <button className="btn btn-dark" type="button" onClick={() => submitOverride(r)} disabled={!overrideText.trim()}>Confirm override → {r.status === "approved" ? "Reject" : "Approve"}</button>
                        <button className="btn btn-outline" type="button" onClick={() => { setOverrideFor(null); setOverrideText(""); }}>Cancel</button>
                      </div>
                    </div>
                  ) : r.status !== "question" ? (
                    <button className="btn btn-outline" type="button" style={{ marginTop: "0.3rem" }} onClick={() => { setOverrideFor(r.id); setOverrideText(""); }}>CEO: Override decision</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
