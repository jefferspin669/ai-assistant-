"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  explainableForQuery,
  explainableRecommendations,
} from "@/lib/atlas-platform";

function scoreTone(score: number) {
  if (score >= 80) return "ok";
  if (score >= 65) return "warn";
  return "";
}

export function ExplainableAIStudio() {
  const [selectedId, setSelectedId] = useState<string>(explainableRecommendations[0].id);
  const [input, setInput] = useState("Raise prices.");
  const [custom, setCustom] = useState<ReturnType<typeof explainableForQuery> | null>(null);
  const [revealed, setRevealed] = useState(true);

  const active = useMemo(() => {
    if (custom) return custom;
    return (
      explainableRecommendations.find((item) => item.id === selectedId) ??
      explainableRecommendations[0]
    );
  }, [custom, selectedId]);

  function explain(query: string) {
    const result = explainableForQuery(query.trim() || "Raise prices.");
    const known = explainableRecommendations.some((item) => item.id === result.id);
    setCustom(known ? null : result);
    if (known) setSelectedId(result.id);
    setRevealed(false);
    window.setTimeout(() => setRevealed(true), 450);
  }

  function onAsk(e: FormEvent) {
    e.preventDefault();
    explain(input);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Confidence</span>
          <strong>{active.confidence}</strong>
          <small>On this recommendation</small>
        </div>
        <div className="stat">
          <span>Alternatives</span>
          <strong>{active.alternatives.length}</strong>
          <small>Ranked options</small>
        </div>
        <div className="stat">
          <span>Risks shown</span>
          <strong>{active.risks.length}</strong>
          <small>Before you decide</small>
        </div>
        <div className="stat">
          <span>Data points</span>
          <strong>{active.supportingData.length}</strong>
          <small>Supporting evidence</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Explainable AI</h2>
          <p className="panel-lead">
            Instead of a blunt order, Atlas shows why, supporting data, risks, expected outcomes,
            confidence, and alternatives — so leaders can trust the call.
          </p>
          <form className="train-form" onSubmit={onAsk}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Try: Raise prices."
              aria-label="Recommendation to explain"
            />
            <button className="btn btn-dark" type="submit">
              Explain
            </button>
          </form>

          <div className="list" style={{ marginTop: "1rem" }}>
            {explainableRecommendations.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  !custom && selectedId === item.id ? "compliance-row active" : "compliance-row"
                }
                onClick={() => {
                  setCustom(null);
                  setSelectedId(item.id);
                  setInput(item.blunt);
                  setRevealed(true);
                }}
              >
                <span className={`badge ${scoreTone(item.confidence)}`}>{item.confidence}</span>
                <div>
                  <p>
                    <strong>{item.blunt}</strong>
                  </p>
                  <small className="muted-line">{item.title}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          {!revealed ? (
            <p className="muted-line">Building explanation…</p>
          ) : (
            <>
              <div className="memory-card">
                <div className="label">Instead of a black box</div>
                <p>
                  <strong style={{ textDecoration: "line-through", opacity: 0.55 }}>{active.blunt}</strong>
                </p>
                <p style={{ marginTop: "0.45rem" }}>
                  <strong>{active.title}</strong>
                </p>
                <p className="muted-line" style={{ marginTop: "0.35rem" }}>
                  Confidence {active.confidence}
                </p>
              </div>

              <h3 style={{ marginTop: "1rem" }}>Why</h3>
              <p className="panel-lead">{active.why}</p>

              <h3 style={{ marginTop: "1rem" }}>Supporting data</h3>
              <div className="list">
                {active.supportingData.map((item) => (
                  <div className="list-row" key={item}>
                    <span className="badge ok">Data</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: "1rem" }}>Risks</h3>
              <div className="list">
                {active.risks.map((item) => (
                  <div className="list-row" key={item}>
                    <span className="badge warn">Risk</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: "1rem" }}>Expected outcomes</h3>
              <div className="list">
                {active.expectedOutcomes.map((item) => (
                  <div className="list-row" key={item}>
                    <span className="badge">Outcome</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>

              <h3 style={{ marginTop: "1rem" }}>Alternative options</h3>
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
          )}
        </section>
      </div>
    </div>
  );
}
