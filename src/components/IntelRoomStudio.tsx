"use client";

import { FormEvent, useState } from "react";
import {
  intelAnswer,
  intelQuestions,
  type IntelAnswer,
} from "@/lib/executive-suite";

export function IntelRoomStudio() {
  const [input, setInput] = useState(intelQuestions[0].question);
  const [answer, setAnswer] = useState<IntelAnswer>(intelQuestions[0]);
  const [thinking, setThinking] = useState(false);

  function ask(query: string) {
    setThinking(true);
    window.setTimeout(() => {
      setAnswer(intelAnswer(query));
      setThinking(false);
    }, 450);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input.trim() || intelQuestions[0].question);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Internal sources</span>
          <strong>Live</strong>
          <small>Financials, ops, talent, CRM</small>
        </div>
        <div className="stat">
          <span>Public sources</span>
          <strong>Live</strong>
          <small>Market, competitors, macro</small>
        </div>
        <div className="stat">
          <span>Room</span>
          <strong>Private</strong>
          <small>Leadership-only</small>
        </div>
        <div className="stat">
          <span>Confidence</span>
          <strong style={{ fontSize: "1rem" }}>{answer.confidence}</strong>
          <small>On current answer</small>
        </div>
      </div>

      <section className="panel">
        <h2>Ask the intelligence room</h2>
        <p className="panel-lead">
          Questions are answered by fusing internal data with public market signals.
        </p>
        <form className="train-form" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. What could hurt us in the next 24 months?"
            aria-label="Intelligence question"
          />
          <button className="btn btn-dark" type="submit" disabled={thinking}>
            {thinking ? "Analyzing…" : "Ask"}
          </button>
        </form>
        <div className="cta-row" style={{ marginTop: "0.75rem" }}>
          {intelQuestions.map((q) => (
            <button
              key={q.question}
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setInput(q.question);
                ask(q.question);
              }}
            >
              {q.question}
            </button>
          ))}
        </div>
      </section>

      <div className="memory-card">
        <div className="label">Answer</div>
        <p>
          <strong>{answer.headline}</strong>
        </p>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Internal signals</h2>
          <div className="list">
            {answer.internal.map((line) => (
              <div className="list-row" key={line}>
                <span className="badge">Internal</span>
                <p>{line}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>Public / market signals</h2>
          <div className="list">
            {answer.external.map((line) => (
              <div className="list-row" key={line}>
                <span className="badge warn">Public</span>
                <p>{line}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Synthesis</h2>
        <p style={{ marginTop: "0.3rem" }}>
          <span className="agent-tag">Atlas · private intelligence</span>
        </p>
        <p style={{ marginTop: "0.4rem" }}>{answer.synthesis}</p>
      </section>
    </div>
  );
}
