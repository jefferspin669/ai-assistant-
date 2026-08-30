"use client";

import { FormEvent, useState } from "react";
import {
  boardAnswer,
  boardCommitments,
  boardPacket,
  boardQuestions,
  boardRisks,
  type BoardQuestion,
  type Tone,
} from "@/lib/executive-suite";

type Mode = "packet" | "risks" | "commitments" | "simulate";

const modes: { id: Mode; label: string }[] = [
  { id: "packet", label: "Board packet" },
  { id: "risks", label: "Major risks" },
  { id: "commitments", label: "Commitments" },
  { id: "simulate", label: "Hard questions" },
];

function sevBadge(tone: Tone) {
  if (tone === "bad") return "badge warn";
  if (tone === "warn") return "badge";
  return "badge ok";
}

function commitBadge(status: string) {
  if (status === "Done") return "badge ok";
  if (status === "At risk") return "badge warn";
  return "badge";
}

export function BoardroomStudio() {
  const [mode, setMode] = useState<Mode>("packet");
  const [input, setInput] = useState("Why did margin miss while revenue beat?");
  const [answer, setAnswer] = useState<BoardQuestion>(boardQuestions[0]);

  function ask(e: FormEvent) {
    e.preventDefault();
    setAnswer(boardAnswer(input));
  }

  const readyCount = boardPacket.filter((p) => p.status !== "Needs input").length;
  const openCommitments = boardCommitments.filter((c) => c.status !== "Done").length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Packet</span>
          <strong>
            {readyCount}/{boardPacket.length}
          </strong>
          <small>Sections ready</small>
        </div>
        <div className="stat">
          <span>Major risks</span>
          <strong>{boardRisks.length}</strong>
          <small>Summarized for the board</small>
        </div>
        <div className="stat">
          <span>Open commitments</span>
          <strong>{openCommitments}</strong>
          <small>From past meetings</small>
        </div>
        <div className="stat">
          <span>Rehearsal bank</span>
          <strong>{boardQuestions.length}</strong>
          <small>Hard questions ready</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Boardroom modes">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "packet" ? (
        <section className="panel">
          <h2>Board packet</h2>
          <p className="panel-lead">Auto-assembled from the quarter&apos;s data. Review, then lock.</p>
          <div className="list">
            {boardPacket.map((p) => (
              <div className="list-row" key={p.section}>
                <span
                  className={
                    p.status === "Locked"
                      ? "badge ok"
                      : p.status === "Needs input"
                        ? "badge warn"
                        : "badge"
                  }
                >
                  {p.status}
                </span>
                <p>
                  <strong>{p.section}</strong>
                  <span className="muted-line">{p.detail}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "risks" ? (
        <section className="panel">
          <h2>Major risks summary</h2>
          <div className="list">
            {boardRisks.map((r) => (
              <div className="list-row" key={r.title}>
                <span className={sevBadge(r.severity)}>
                  {r.severity === "bad" ? "High" : "Watch"}
                </span>
                <p>
                  <strong>{r.title}</strong>
                  <span className="muted-line">{r.detail}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "commitments" ? (
        <section className="panel">
          <h2>Commitment tracker</h2>
          <p className="panel-lead">What leadership promised the board — and where each stands.</p>
          <div className="list">
            {boardCommitments.map((c) => (
              <div className="list-row" key={c.item}>
                <span className={commitBadge(c.status)}>{c.status}</span>
                <p>
                  <strong>{c.item}</strong>
                  <span className="muted-line">
                    {c.owner} · committed {c.from}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "simulate" ? (
        <div className="split">
          <section className="panel">
            <h2>Rehearse a hard question</h2>
            <p className="panel-lead">
              Ask what a tough director or investor might ask. Atlas answers the way you should.
            </p>
            <form className="train-form" onSubmit={ask}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Why deploy capital into M&A instead of a buyback?"
                aria-label="Board question"
              />
              <button className="btn btn-dark" type="submit">
                Simulate
              </button>
            </form>
            <div className="list" style={{ marginTop: "1rem" }}>
              {boardQuestions.map((q) => (
                <button
                  key={q.question}
                  type="button"
                  className="compliance-row"
                  onClick={() => {
                    setInput(q.question);
                    setAnswer(q);
                  }}
                >
                  <span className="badge">Ask</span>
                  <p>
                    <strong>{q.question}</strong>
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Suggested answer</h2>
            <div className="memory-card">
              <div className="label">Director asks</div>
              <p>
                <strong>{answer.question}</strong>
              </p>
            </div>
            <p style={{ marginTop: "0.9rem" }}>
              <span className="agent-tag">Atlas · boardroom coach</span>
            </p>
            <p style={{ marginTop: "0.4rem" }}>{answer.answer}</p>
            {answer.followups.length ? (
              <>
                <h3 style={{ marginTop: "1rem" }}>Likely follow-ups</h3>
                <div className="list">
                  {answer.followups.map((f) => (
                    <div className="list-row" key={f}>
                      <span className="badge warn">Next</span>
                      <p>{f}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
