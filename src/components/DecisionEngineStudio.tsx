"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  decisionCases,
  decisionDimensions,
  decisionForQuery,
} from "@/lib/atlas-platform";

type Mode = "evaluate" | "dimensions" | "history";

const modes: { id: Mode; label: string }[] = [
  { id: "evaluate", label: "Evaluate" },
  { id: "dimensions", label: "8 lenses" },
  { id: "history", label: "Recent decisions" },
];

function scoreTone(score: number) {
  if (score >= 80) return "ok";
  if (score >= 65) return "warn";
  return "";
}

export function DecisionEngineStudio() {
  const [mode, setMode] = useState<Mode>("evaluate");
  const [caseId, setCaseId] = useState<string>(decisionCases[0].id);
  const [input, setInput] = useState("Should we switch suppliers?");
  const [custom, setCustom] = useState<ReturnType<typeof decisionForQuery> | null>(null);
  const [revealed, setRevealed] = useState<number>(decisionDimensions.length);
  const [running, setRunning] = useState(false);

  const active = useMemo(() => {
    if (custom) return custom;
    return decisionCases.find((item) => item.id === caseId) ?? decisionCases[0];
  }, [caseId, custom]);

  function runEvaluation(query: string) {
    const result = decisionForQuery(query.trim() || decisionCases[0].asked);
    const known = decisionCases.some((item) => item.id === result.id);
    setCustom(known ? null : result);
    if (known) setCaseId(result.id);
    setRevealed(0);
    setRunning(true);
    setMode("evaluate");

    decisionDimensions.forEach((_, index) => {
      window.setTimeout(() => {
        setRevealed(index + 1);
        if (index === decisionDimensions.length - 1) setRunning(false);
      }, 280 * (index + 1));
    });
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    runEvaluation(input);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Lenses</span>
          <strong>{decisionDimensions.length}</strong>
          <small>Auto-scored before commit</small>
        </div>
        <div className="stat">
          <span>Confidence</span>
          <strong>{active.confidence}</strong>
          <small>{active.verdict}</small>
        </div>
        <div className="stat">
          <span>Alternatives</span>
          <strong>{active.alternatives.length}</strong>
          <small>Ranked options</small>
        </div>
        <div className="stat">
          <span>Cases</span>
          <strong>{decisionCases.length}</strong>
          <small>In review history</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Decision engine modes">
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

      {mode === "evaluate" ? (
        <div className="split">
          <section className="panel">
            <h2>Before you decide</h2>
            <p className="panel-lead">
              Atlas scores financial, legal, customer, workload, ops, risk, return, and alternatives.
            </p>
            <form className="train-form" onSubmit={onAsk}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a major decision…"
                aria-label="Decision question"
              />
              <button className="btn btn-dark" type="submit" disabled={running}>
                {running ? "Scoring…" : "Run engine"}
              </button>
            </form>
            <div className="list" style={{ marginTop: "1rem" }}>
              {decisionCases.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    !custom && caseId === item.id ? "compliance-row active" : "compliance-row"
                  }
                  onClick={() => {
                    setCustom(null);
                    setCaseId(item.id);
                    setInput(item.asked);
                    setRevealed(decisionDimensions.length);
                  }}
                >
                  <span className={`badge ${scoreTone(item.confidence)}`}>{item.verdict}</span>
                  <p>
                    <strong>{item.title}</strong>
                    <span className="muted-line">{item.asked}</span>
                  </p>
                </button>
              ))}
            </div>

            <div className="memory-card" style={{ marginTop: "1.1rem" }}>
              <div className="label">
                {active.verdict} · confidence {active.confidence}
              </div>
              <p>
                <strong>{active.title}</strong>
              </p>
              <p className="muted-line" style={{ marginTop: "0.35rem" }}>
                {active.recommendation}
              </p>
            </div>
          </section>

          <section className="panel">
            <h2>Dimension scores</h2>
            <div className="list">
              {decisionDimensions.slice(0, revealed).map((dim) => {
                const score = active.scores[dim.id as keyof typeof active.scores];
                return (
                  <div className="list-row" key={dim.id}>
                    <span className={`badge ${scoreTone(score.score)}`}>{score.score}</span>
                    <p>
                      <strong>{dim.label}</strong>
                      <span className="muted-line">{score.note}</span>
                    </p>
                  </div>
                );
              })}
              {revealed < decisionDimensions.length ? (
                <div className="list-row">
                  <span className="badge warn">…</span>
                  <p className="muted-line">Evaluating remaining lenses…</p>
                </div>
              ) : null}
            </div>

            {revealed >= decisionDimensions.length ? (
              <>
                <h3 style={{ marginTop: "1rem" }}>Alternatives ranked</h3>
                <div className="list">
                  {active.alternatives.map((alt) => (
                    <div className="list-row" key={alt.name}>
                      <span className={`badge ${scoreTone(alt.score)}`}>{alt.score}</span>
                      <p>
                        <strong>{alt.name}</strong>
                        <span className="muted-line">{alt.outcome}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "dimensions" ? (
        <section className="panel">
          <h2>Eight automatic lenses</h2>
          <p className="panel-lead">Every major decision is scored before Atlas recommends a path.</p>
          <div className="pack-grid dense" style={{ marginTop: "1rem" }}>
            {decisionDimensions.map((dim) => (
              <div className="domain-card" key={dim.id}>
                <strong>{dim.label}</strong>
                <span>Weighted into confidence and surfaced with Board Advisor when stakes are high.</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "history" ? (
        <section className="panel">
          <h2>Recent evaluations</h2>
          <div className="list">
            {decisionCases.map((item) => (
              <div className="list-row" key={item.id}>
                <span className={`badge ${scoreTone(item.confidence)}`}>{item.confidence}</span>
                <p>
                  <strong>{item.title}</strong>
                  <span className="muted-line">
                    {item.verdict} · {item.recommendation}
                  </span>
                </p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setCustom(null);
                    setCaseId(item.id);
                    setInput(item.asked);
                    setRevealed(decisionDimensions.length);
                    setMode("evaluate");
                  }}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
