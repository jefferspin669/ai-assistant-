"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  approveReply,
  autoReplyEnabled,
  draftReviewReply,
  loadReviews,
  loadReviewSources,
  recurringComplaints,
  reputationMode,
  saveReviewSources,
  setAutoReply,
  submitReplyForApproval,
  type ReviewItem,
} from "@/lib/reputation-workspace";

export function ReputationStudio() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [sources, setSources] = useState(loadReviewSources());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    const items = loadReviews();
    setReviews(items);
    setSelectedId(items[0]?.id ?? null);
    setAuto(autoReplyEnabled());
  }, []);

  const selected = reviews.find((r) => r.id === selectedId) ?? reviews[0];
  const complaints = recurringComplaints();

  function refresh() {
    setReviews(loadReviews());
  }

  function toggleSource(id: string) {
    const next = sources.map((s) => (s.id === id ? { ...s, connected: !s.connected } : s));
    setSources(next);
    saveReviewSources(next);
  }

  function onDraft(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    draftReviewReply(selected.id, replyText);
    refresh();
  }

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">Reputation · {reputationMode()}</div>
        <p>Connect Google Business Profile and supported platforms to pull reviews into one inbox.</p>
        {complaints.length ? (
          <p><strong>Recurring complaints:</strong> {complaints.join(", ")}</p>
        ) : null}
      </div>

      <section className="panel">
        <h2>Review sources</h2>
        <div className="list">
          {sources.map((s) => (
            <div key={s.id} className="compliance-row">
              <p><strong>{s.name}</strong></p>
              <button className="btn btn-outline" type="button" onClick={() => toggleSource(s.id)}>
                {s.connected ? "Connected" : "Connect"}
              </button>
            </div>
          ))}
        </div>
        <label style={{ marginTop: "1rem" }}>
          <input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); setAutoReply(e.target.checked); }} />
          Auto-publish replies (requires automation — default is approval)
        </label>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Inbox</h2>
          <div className="list">
            {reviews.map((r) => (
              <button
                key={r.id}
                type="button"
                className={selectedId === r.id ? "compliance-row active" : "compliance-row"}
                onClick={() => { setSelectedId(r.id); setReplyText(r.draftReply ?? ""); }}
              >
                <div>
                  <p>
                    <strong>{r.author}</strong> · {r.rating}★ · {r.source}
                    {r.serious ? <span className="badge warn">Alert</span> : null}
                  </p>
                  <p className="muted-line">{r.text}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section className="panel">
            <h2>Reply</h2>
            <p className="muted-line">Sentiment: {selected.sentiment} · {selected.replyStatus}</p>
            <form className="form-grid" onSubmit={onDraft}>
              <label>
                Draft reply
                <textarea rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              </label>
              <div className="cta-row">
                <button className="btn btn-outline" type="submit">Save draft</button>
                <button className="btn btn-dark" type="button" onClick={() => { submitReplyForApproval(selected.id); refresh(); }}>
                  Submit for approval
                </button>
                <button className="btn btn-dark" type="button" onClick={() => { approveReply(selected.id); refresh(); }}>
                  Approve & publish
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}
