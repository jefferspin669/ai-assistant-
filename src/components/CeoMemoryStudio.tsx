"use client";

import { FormEvent, useMemo, useState } from "react";
import { ceoMemories, ceoMemoryForQuestion } from "@/lib/atlas-platform";

type Mode = "ask" | "archive" | "recall";

const modes: { id: Mode; label: string }[] = [
  { id: "ask", label: "Ask why" },
  { id: "archive", label: "Decision archive" },
  { id: "recall", label: "Six months later" },
];

const prompts = [
  "Why did we increase prices in 2025?",
  "Why did we switch suppliers?",
  "Why did we lease a second van?",
  "Why did we raise the diagnostic fee?",
  "Why did we delay the second location?",
];

export function CeoMemoryStudio() {
  const [mode, setMode] = useState<Mode>("ask");
  const [input, setInput] = useState("Why did we increase prices in 2025?");
  const [memoryId, setMemoryId] = useState<string>(ceoMemories[0].id);
  const [custom, setCustom] = useState<ReturnType<typeof ceoMemoryForQuestion> | null>(null);
  const [recalling, setRecalling] = useState(false);
  const [showAnswer, setShowAnswer] = useState(true);

  const active = useMemo(() => {
    if (custom) return custom;
    return ceoMemories.find((item) => item.id === memoryId) ?? ceoMemories[0];
  }, [custom, memoryId]);

  function recall(question: string) {
    const result = ceoMemoryForQuestion(question.trim() || prompts[0]);
    const known = ceoMemories.some((item) => item.id === result.id);
    setCustom(known ? null : result);
    if (known) setMemoryId(result.id);
    setShowAnswer(false);
    setRecalling(true);
    setMode("ask");
    window.setTimeout(() => {
      setShowAnswer(true);
      setRecalling(false);
    }, 700);
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    recall(input);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Remembered</span>
          <strong>{ceoMemories.length}</strong>
          <small>CEO decisions</small>
        </div>
        <div className="stat">
          <span>Approved by</span>
          <strong>{active.approvedBy}</strong>
          <small>{active.date}</small>
        </div>
        <div className="stat">
          <span>Alternatives</span>
          <strong>{active.alternativesReviewed.length || "—"}</strong>
          <small>Reviewed at decision time</small>
        </div>
        <div className="stat">
          <span>Triggers</span>
          <strong>{active.triggers.length}</strong>
          <small>Signals that drove it</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Executive Memory modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "ask" ? (
        <div className="split">
          <section className="panel">
            <h2>Executive Memory</h2>
            <p className="panel-lead">
              Atlas remembers years of decisions — with context, supporting data, and meeting notes.
            </p>
            <form className="train-form" onSubmit={onAsk}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Why did we…?"
                aria-label="CEO memory question"
              />
              <button className="btn btn-dark" type="submit" disabled={recalling}>
                {recalling ? "Recalling…" : "Ask Atlas"}
              </button>
            </form>
            <div className="list" style={{ marginTop: "1rem" }}>
              {prompts.map((prompt) => (
                <div className="list-row" key={prompt}>
                  <span className="badge">Try</span>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      setInput(prompt);
                      recall(prompt);
                    }}
                  >
                    {prompt}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <p className="muted-line">Six months later…</p>
            <h2 style={{ marginTop: "0.35rem" }}>{active.question}</h2>
            {showAnswer ? (
              <>
                <div className="memory-card ceo-answer" style={{ marginTop: "0.85rem" }}>
                  <div className="label">Atlas answers</div>
                  <p>{active.answer}</p>
                </div>
                <div className="list" style={{ marginTop: "1rem" }}>
                  <div className="list-row">
                    <span className="badge ok">{active.date}</span>
                    <p>
                      <strong>Decision logged</strong>
                      <span className="muted-line">{active.decision}</span>
                    </p>
                  </div>
                  {active.triggers.map((trigger) => (
                    <div className="list-row" key={trigger}>
                      <span className="badge warn">Signal</span>
                      <p>{trigger}</p>
                    </div>
                  ))}
                </div>
                {active.alternativesReviewed.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "1rem" }}>Alternatives you reviewed</h3>
                    <ul className="plain-list">
                      {active.alternativesReviewed.map((alt) => (
                        <li key={alt}>{alt}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {"supportingData" in active && active.supportingData.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "1rem" }}>Supporting data</h3>
                    <ul className="plain-list">
                      {active.supportingData.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {"meetingNotes" in active && active.meetingNotes.length > 0 ? (
                  <>
                    <h3 style={{ marginTop: "1rem" }}>Meeting notes</h3>
                    <ul className="plain-list">
                      {active.meetingNotes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </>
            ) : (
              <p className="muted-line" style={{ marginTop: "1rem" }}>
                Searching decision history…
              </p>
            )}
          </section>
        </div>
      ) : null}

      {mode === "archive" ? (
        <section className="panel">
          <h2>Decision archive</h2>
          <div className="list">
            {ceoMemories.map((item) => (
              <div className="list-row" key={item.id}>
                <span className="badge ok">{item.date}</span>
                <p>
                  <strong>{item.question}</strong>
                  <span className="muted-line">{item.decision}</span>
                </p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setCustom(null);
                    setMemoryId(item.id);
                    setInput(item.question);
                    setShowAnswer(true);
                    setMode("ask");
                  }}
                >
                  Recall
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "recall" ? (
        <section className="panel">
          <h2>How CEO Memory works</h2>
          <div className="pack-grid dense" style={{ marginTop: "1rem" }}>
            <div className="domain-card">
              <strong>1. Decision made</strong>
              <span>Atlas stores the question, alternatives, signals, and your approval.</span>
            </div>
            <div className="domain-card">
              <strong>2. Time passes</strong>
              <span>Weeks or months later, ask in plain language — no hunting through email.</span>
            </div>
            <div className="domain-card">
              <strong>3. Exact recall</strong>
              <span>
                Atlas answers with the date, the triggers, and what you reviewed before approving.
              </span>
            </div>
          </div>
          <div className="train-actions">
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                setInput("Why did we switch suppliers?");
                recall("Why did we switch suppliers?");
              }}
            >
              Replay supplier example
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
