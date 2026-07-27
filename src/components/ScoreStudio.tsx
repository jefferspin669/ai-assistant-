"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { intelligenceScore } from "@/lib/atlas-platform";

type Mode = "score" | "pillars" | "why" | "improve";

const modes: { id: Mode; label: string }[] = [
  { id: "score", label: "Score" },
  { id: "pillars", label: "Pillars" },
  { id: "why", label: "Why it changed" },
  { id: "improve", label: "Improve" },
];

export function ScoreStudio() {
  const [mode, setMode] = useState<Mode>("score");
  const [selectedPillar, setSelectedPillar] = useState(intelligenceScore.pillars[0].name);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);

  const { score, previous, change, business, pillars, why, drivers, recommendations, next } =
    intelligenceScore;

  const selected = useMemo(
    () => pillars.find((pillar) => pillar.name === selectedPillar) ?? pillars[0],
    [pillars, selectedPillar],
  );

  const weakest = useMemo(
    () => [...pillars].sort((a, b) => a.value - b.value)[0],
    [pillars],
  );

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Intelligence Score</span>
          <strong>{score}</strong>
          <small>{change}</small>
        </div>
        <div className="stat">
          <span>Previous</span>
          <strong>{previous}</strong>
          <small>Last week</small>
        </div>
        <div className="stat">
          <span>Pillars</span>
          <strong>{pillars.length}</strong>
          <small>Health dimensions</small>
        </div>
        <div className="stat">
          <span>Weakest</span>
          <strong>{weakest.value}</strong>
          <small>{weakest.name}</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Intelligence Score modes">
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

      {mode === "score" ? (
        <section className="panel">
          <div className="score-hero">
            <div className="score-ring" style={{ ["--score" as string]: score }}>
              {score}
            </div>
            <div>
              <h2 style={{ marginBottom: "0.35rem" }}>{business}</h2>
              <p className="panel-lead" style={{ marginBottom: "0.45rem" }}>
                {change} · was {previous}
              </p>
              <p>{why}</p>
              <p style={{ marginTop: "0.55rem" }}>
                <strong>Next:</strong> {next}
              </p>
              <div className="train-actions">
                <button className="btn btn-dark" type="button" onClick={() => setMode("why")}>
                  Why it changed
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setMode("improve")}>
                  Highest-impact fixes
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {mode === "pillars" ? (
        <div className="split">
          <section className="panel">
            <h2>Health pillars (0–100)</h2>
            <p className="panel-lead">
              Customer satisfaction, response times, revenue trends, employee productivity, marketing
              effectiveness, cash flow, inventory health, compliance, security, and growth.
            </p>
            <div className="pillar-bars">
              {pillars.map((pillar) => (
                <button
                  key={pillar.name}
                  type="button"
                  className={
                    selectedPillar === pillar.name ? "pillar-bar-btn active" : "pillar-bar-btn"
                  }
                  onClick={() => setSelectedPillar(pillar.name)}
                >
                  <span>{pillar.name}</span>
                  <div className="track">
                    <div className="fill" style={{ width: `${pillar.value}%` }} />
                  </div>
                  <strong>
                    {pillar.value}
                    <small className="muted-line">
                      {pillar.delta > 0 ? `+${pillar.delta}` : pillar.delta === 0 ? "—" : String(pillar.delta)}
                    </small>
                  </strong>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>{selected.name}</h2>
            <div className="memory-card">
              <div className="label">This week</div>
              <p>
                Score {selected.value}
                {selected.delta === 0
                  ? " · unchanged"
                  : selected.delta > 0
                    ? ` · up ${selected.delta}`
                    : ` · down ${Math.abs(selected.delta)}`}
              </p>
            </div>
            {selected.name === weakest.name ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                This is your weakest pillar — Atlas ranks it first in improvements.
              </p>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "why" ? (
        <section className="panel">
          <h2>Why the score changed</h2>
          <p className="panel-lead">{why}</p>
          <div className="list">
            {drivers.map((driver) => (
              <div className="list-row" key={driver.label}>
                <span className={`badge${driver.impact.includes("-") ? " warn" : " ok"}`}>
                  {driver.impact}
                </span>
                <div>
                  <p>
                    <strong>{driver.label}</strong>
                  </p>
                  <small className="muted-line">{driver.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "improve" ? (
        <section className="panel">
          <h2>Highest-impact improvements</h2>
          <p className="panel-lead">{next}</p>
          <div className="list">
            {recommendations.map((rec) => (
              <div className="list-row" key={rec.title}>
                <span className={`badge${accepted[rec.title] ? " ok" : " warn"}`}>
                  {accepted[rec.title] ? "Queued" : rec.impact}
                </span>
                <div>
                  <p>
                    <strong>{rec.title}</strong>
                  </p>
                  <small className="muted-line">{rec.detail}</small>
                  <div className="train-actions">
                    <Link className="btn btn-outline" href={rec.href}>
                      Open
                    </Link>
                    <button
                      className="btn btn-dark"
                      type="button"
                      disabled={Boolean(accepted[rec.title])}
                      onClick={() => {
                        setAccepted((prev) => ({ ...prev, [rec.title]: true }));
                        setNote(`Atlas queued “${rec.title}” for the team.`);
                      }}
                    >
                      {accepted[rec.title] ? "Queued" : "Do this"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
