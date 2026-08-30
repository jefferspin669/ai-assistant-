"use client";

import { useMemo, useState } from "react";
import {
  successionScenarios,
  type SuccessionScenarioId,
  type Tone,
} from "@/lib/executive-suite";

function sevBadge(tone: Tone) {
  if (tone === "bad") return "badge warn";
  if (tone === "warn") return "badge";
  return "badge ok";
}

function readinessTone(n: number): Tone {
  if (n >= 75) return "ok";
  if (n >= 65) return "warn";
  return "bad";
}

export function SuccessionStudio() {
  const [id, setId] = useState<SuccessionScenarioId>("steps-away");
  const active = useMemo(
    () => successionScenarios.find((s) => s.id === id) ?? successionScenarios[0],
    [id],
  );

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Scenario</span>
          <strong style={{ fontSize: "1rem" }}>{active.label}</strong>
          <small>Modeled outcome</small>
        </div>
        <div className="stat">
          <span>Readiness</span>
          <strong>{active.readiness}%</strong>
          <small>Preparedness score</small>
        </div>
        <div className="stat">
          <span>Cascade areas</span>
          <strong>{active.cascade.length}</strong>
          <small>Impacted functions</small>
        </div>
        <div className="stat">
          <span>Plan steps</span>
          <strong>{active.plan.length}</strong>
          <small>To raise readiness</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Succession scenarios">
        {successionScenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={id === s.id}
            className={id === s.id ? "training-tab active" : "training-tab"}
            onClick={() => setId(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="split">
        <section className="panel">
          <h2>What happens Monday</h2>
          <div className="memory-card">
            <div className="label">
              Readiness{" "}
              <span className={`badge ${readinessTone(active.readiness)}`} style={{ marginLeft: "0.4rem" }}>
                {active.readiness}%
              </span>
            </div>
            <p>{active.monday}</p>
          </div>
          <div className="bars" style={{ marginTop: "1rem" }}>
            <div className="bar-row">
              <span>Readiness</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${active.readiness}%` }} />
              </span>
              <strong>{active.readiness}%</strong>
            </div>
          </div>

          <h3 style={{ marginTop: "1rem" }}>Plan to raise readiness</h3>
          <div className="list">
            {active.plan.map((step, i) => (
              <div className="list-row" key={step}>
                <span className="badge">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Cascade effects</h2>
          <p className="panel-lead">How the shock ripples across the company.</p>
          <div className="list">
            {active.cascade.map((c) => (
              <div className="list-row" key={c.area}>
                <span className={sevBadge(c.severity)}>
                  {c.severity === "bad" ? "High" : c.severity === "warn" ? "Watch" : "OK"}
                </span>
                <p>
                  <strong>{c.area}</strong>
                  <span className="muted-line">{c.effect}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
