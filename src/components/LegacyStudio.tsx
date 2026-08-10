"use client";

import {
  foundations,
  generationalGoals,
  legacyMission,
  ownershipStructure,
  philanthropyGoals,
} from "@/lib/executive-suite";

export function LegacyStudio() {
  const committedTotal = foundations.length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Mission horizon</span>
          <strong>{legacyMission.horizon}</strong>
          <small>Owner-operated intent</small>
        </div>
        <div className="stat">
          <span>Foundations</span>
          <strong>{committedTotal}</strong>
          <small>Active giving vehicles</small>
        </div>
        <div className="stat">
          <span>Ownership held</span>
          <strong>{ownershipStructure[0].stake}</strong>
          <small>Founder & family trust</small>
        </div>
        <div className="stat">
          <span>Generational goals</span>
          <strong>{generationalGoals.length}</strong>
          <small>5 / 10 / 25-year</small>
        </div>
      </div>

      <section className="panel">
        <h2>Long-term mission</h2>
        <div className="memory-card">
          <div className="label">{legacyMission.horizon}</div>
          <p>{legacyMission.statement}</p>
        </div>
        <div className="cta-row" style={{ marginTop: "0.9rem" }}>
          {legacyMission.values.map((v) => (
            <span className="badge" key={v}>
              {v}
            </span>
          ))}
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Foundations & philanthropy</h2>
          <div className="list">
            {foundations.map((f) => (
              <div className="list-row" key={f.name}>
                <span className="badge ok">{f.status}</span>
                <p>
                  <strong>{f.name}</strong>
                  <span className="muted-line">{f.focus}</span>
                  <span className="muted-line">
                    {f.committed} · {f.annual}
                  </span>
                </p>
              </div>
            ))}
          </div>

          <h3 style={{ marginTop: "1rem" }}>Giving goals</h3>
          <div className="bars" style={{ marginTop: "0.5rem" }}>
            {philanthropyGoals.map((g) => (
              <div className="bar-row" key={g.goal}>
                <span title={g.goal}>{g.goal}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${g.progress}%` }} />
                </span>
                <strong>{g.progress}%</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Ownership structure</h2>
          <div className="list">
            {ownershipStructure.map((o) => (
              <div className="list-row" key={o.holder}>
                <span className="badge">{o.stake}</span>
                <p>
                  <strong>{o.holder}</strong>
                  <span className="muted-line">{o.note}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Generational goals</h2>
        <div className="timeline">
          {generationalGoals.map((g) => (
            <div className="timeline-item" key={g.horizon}>
              <strong>{g.horizon}</strong>
              <p className="muted-line">{g.goal}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
