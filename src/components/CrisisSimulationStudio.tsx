"use client";

import { useMemo, useState } from "react";
import {
  crisisScenarios,
  type CrisisId,
  type Tone,
} from "@/lib/executive-suite";

function sevBadge(tone: Tone) {
  if (tone === "bad") return "badge warn";
  if (tone === "warn") return "badge";
  return "badge ok";
}

function resilienceTone(n: number): Tone {
  if (n >= 72) return "ok";
  if (n >= 60) return "warn";
  return "bad";
}

export function CrisisSimulationStudio() {
  const [id, setId] = useState<CrisisId>("cyberattack");
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(true);
  const active = useMemo(
    () => crisisScenarios.find((c) => c.id === id) ?? crisisScenarios[0],
    [id],
  );

  function select(next: CrisisId) {
    setId(next);
    setRan(false);
    setRunning(true);
    window.setTimeout(() => {
      setRunning(false);
      setRan(true);
    }, 550);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Scenario</span>
          <strong style={{ fontSize: "0.95rem" }}>{active.label}</strong>
          <small>Under simulation</small>
        </div>
        <div className="stat">
          <span>Resilience</span>
          <strong>{active.resilience}%</strong>
          <small>Preparedness</small>
        </div>
        <div className="stat">
          <span>Ops impacts</span>
          <strong>{active.operational.length}</strong>
          <small>Functions hit</small>
        </div>
        <div className="stat">
          <span>Playbook steps</span>
          <strong>{active.playbook.length}</strong>
          <small>First moves</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Crisis scenarios">
        {crisisScenarios.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={id === c.id}
            className={id === c.id ? "training-tab active" : "training-tab"}
            onClick={() => select(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="memory-card">
        <div className="label">
          Trigger ·{" "}
          <span className={`badge ${resilienceTone(active.resilience)}`} style={{ marginLeft: "0.3rem" }}>
            {active.resilience}% ready
          </span>
        </div>
        <p>{running ? "Simulating impact across operations and finance…" : active.trigger}</p>
      </div>

      {ran && !running ? (
        <>
          <div className="split">
            <section className="panel">
              <h2>Operational effects</h2>
              <div className="list">
                {active.operational.map((o) => (
                  <div className="list-row" key={o.area}>
                    <span className={sevBadge(o.severity)}>
                      {o.severity === "bad" ? "Severe" : o.severity === "warn" ? "Moderate" : "Minor"}
                    </span>
                    <p>
                      <strong>{o.area}</strong>
                      <span className="muted-line">{o.effect}</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Financial effects</h2>
              <div className="list">
                {active.financial.map((f) => (
                  <div className="list-row" key={f.metric}>
                    <span className={sevBadge(f.tone)}>{f.metric}</span>
                    <p>{f.impact}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="split">
            <section className="panel">
              <h2>Response timeline</h2>
              <div className="timeline">
                {active.timeline.map((t) => (
                  <div className="timeline-item" key={t.window}>
                    <strong>{t.window}</strong>
                    <p className="muted-line">{t.event}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Playbook — first moves</h2>
              <div className="list">
                {active.playbook.map((p, i) => (
                  <div className="list-row" key={p}>
                    <span className="badge">{i + 1}</span>
                    <p>{p}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : (
        <section className="panel">
          <p className="panel-lead">Running simulation…</p>
        </section>
      )}
    </div>
  );
}
