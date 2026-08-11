"use client";

import { useCallback, useEffect, useState } from "react";
import {
  decideApprovalRequest,
  loadApprovalRequests,
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

export function ApprovalInboxStudio() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [questionFor, setQuestionFor] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState("");
  const [flash, setFlash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => setRequests(loadApprovalRequests()), []);

  useEffect(() => {
    seedApprovalsIfEmpty();
    refresh();
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("atlas-approval-requests")) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

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

  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending");

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat"><span>Pending</span><strong>{pending.length}</strong><small>Awaiting you</small></div>
        <div className="stat"><span>Urgent</span><strong>{pending.filter((r) => r.priority === "urgent").length}</strong><small>Do first</small></div>
        <div className="stat"><span>Decided</span><strong>{decided.length}</strong><small>Recent</small></div>
      </div>

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
              <div className="list-row" key={r.id}>
                <span className={r.status === "approved" ? "badge ok" : r.status === "rejected" ? "badge warn" : "badge"}>
                  {r.status === "approved" ? "Approved" : r.status === "rejected" ? "Rejected" : "Question"}
                </span>
                <p>
                  <strong>{r.title}</strong>
                  <span className="muted-line">by {r.requestedBy}{r.status === "question" && r.question ? ` · Asked: ${r.question}` : ""}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
