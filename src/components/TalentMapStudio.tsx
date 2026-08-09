"use client";

import { useMemo, useState } from "react";
import {
  leaders,
  leadershipGaps,
  type Tone,
} from "@/lib/executive-suite";

function riskBadge(tone: Tone) {
  if (tone === "bad") return "badge warn";
  if (tone === "warn") return "badge";
  return "badge ok";
}

function riskLabel(tone: Tone) {
  if (tone === "bad") return "High flight risk";
  if (tone === "warn") return "Some flight risk";
  return "Stable";
}

export function TalentMapStudio() {
  const [id, setId] = useState(leaders[0].id);
  const active = useMemo(() => leaders.find((l) => l.id === id) ?? leaders[0], [id]);
  const keyPeople = leaders.filter((l) => l.keyPerson).length;
  const overloaded = leaders.filter((l) => l.load >= 85).length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Leaders mapped</span>
          <strong>{leaders.length}</strong>
          <small>Executive team</small>
        </div>
        <div className="stat">
          <span>Key-person deps</span>
          <strong>{keyPeople}</strong>
          <small>Single points of failure</small>
        </div>
        <div className="stat">
          <span>Overloaded</span>
          <strong>{overloaded}</strong>
          <small>Load ≥ 85%</small>
        </div>
        <div className="stat">
          <span>Leadership gaps</span>
          <strong>{leadershipGaps.length}</strong>
          <small>Depth to build</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Executive roster</h2>
          <div className="list">
            {leaders.map((l) => (
              <button
                key={l.id}
                type="button"
                className={id === l.id ? "compliance-row active" : "compliance-row"}
                onClick={() => setId(l.id)}
              >
                <span className={riskBadge(l.flightRisk)}>{l.strength}</span>
                <p>
                  <strong>
                    {l.name} · {l.role}
                    {l.keyPerson ? " · key person" : ""}
                  </strong>
                  <span className="muted-line">{l.successionReady}</span>
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{active.name}</h2>
          <p className="panel-lead">{active.role}</p>
          <div className="bars" style={{ marginTop: "0.6rem" }}>
            <div className="bar-row">
              <span>Strength</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${active.strength}%` }} />
              </span>
              <strong>{active.strength}</strong>
            </div>
            <div className="bar-row">
              <span>Workload</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${active.load}%` }} />
              </span>
              <strong>{active.load}</strong>
            </div>
          </div>
          <div className="memory-card" style={{ marginTop: "1rem" }}>
            <div className="label">
              {riskLabel(active.flightRisk)} · {active.successionReady}
            </div>
            <p>{active.note}</p>
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Leadership depth gaps</h2>
        <p className="panel-lead">Where the company is thin and what a shock would expose.</p>
        <div className="list">
          {leadershipGaps.map((g) => (
            <div className="list-row" key={g.area}>
              <span className={riskBadge(g.severity)}>
                {g.severity === "bad" ? "Critical" : "Watch"}
              </span>
              <p>
                <strong>{g.area}</strong>
                <span className="muted-line">{g.detail}</span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
