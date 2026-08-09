"use client";

import { useMemo, useState } from "react";
import { reputationIssues, type Tone } from "@/lib/executive-suite";

function sevBadge(tone: Tone) {
  if (tone === "bad") return "badge warn";
  if (tone === "warn") return "badge";
  return "badge ok";
}

export function ReputationCommandStudio() {
  const [id, setId] = useState(reputationIssues[0].id);
  const active = useMemo(
    () => reputationIssues.find((r) => r.id === id) ?? reputationIssues[0],
    [id],
  );
  const escalated = reputationIssues.filter((r) => r.status === "Escalated").length;
  const critical = reputationIssues.filter((r) => r.severity === "bad").length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Active issues</span>
          <strong>{reputationIssues.length}</strong>
          <small>Across all channels</small>
        </div>
        <div className="stat">
          <span>Escalated</span>
          <strong>{escalated}</strong>
          <small>Need a decision</small>
        </div>
        <div className="stat">
          <span>Critical</span>
          <strong>{critical}</strong>
          <small>Reputation-threatening</small>
        </div>
        <div className="stat">
          <span>Response options</span>
          <strong>{active.responses.length}</strong>
          <small>Prepared for selected</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Live feed</h2>
          <div className="list">
            {reputationIssues.map((r) => (
              <button
                key={r.id}
                type="button"
                className={id === r.id ? "compliance-row active" : "compliance-row"}
                onClick={() => setId(r.id)}
              >
                <span className={sevBadge(r.severity)}>{r.type}</span>
                <p>
                  <strong>{r.headline}</strong>
                  <span className="muted-line">
                    {r.source} · {r.reach} · {r.status}
                  </span>
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{active.headline}</h2>
          <p className="panel-lead">
            {active.type} · {active.status} · reach {active.reach}
          </p>
          <div className="memory-card" style={{ marginTop: "0.6rem" }}>
            <div className="label">Situation</div>
            <p>{active.summary}</p>
          </div>
          <h3 style={{ marginTop: "1rem" }}>Prepared response options</h3>
          <div className="list">
            {active.responses.map((opt, i) => (
              <div className="list-row" key={opt.label}>
                <span className={i === 0 ? "badge ok" : "badge"}>
                  {i === 0 ? "Recommended" : "Option"}
                </span>
                <p>
                  <strong>{opt.label}</strong>
                  <span className="muted-line">{opt.detail}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
