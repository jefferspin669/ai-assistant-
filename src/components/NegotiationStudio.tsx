"use client";

import { useMemo, useState } from "react";
import {
  negotiations,
  type NegotiationId,
  type Tone,
} from "@/lib/executive-suite";

function leverageBadge(tone: Tone) {
  if (tone === "ok") return "badge ok";
  if (tone === "warn") return "badge";
  return "badge warn";
}

export function NegotiationStudio() {
  const [id, setId] = useState<NegotiationId>("acquisition");
  const active = useMemo(
    () => negotiations.find((n) => n.id === id) ?? negotiations[0],
    [id],
  );

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Negotiation</span>
          <strong style={{ fontSize: "0.95rem" }}>{active.label}</strong>
          <small>vs. {active.counterparty}</small>
        </div>
        <div className="stat">
          <span>Leverage points</span>
          <strong>{active.leverage.length}</strong>
          <small>Mapped in our favor</small>
        </div>
        <div className="stat">
          <span>Redlines</span>
          <strong>{active.redlines.length}</strong>
          <small>Do-not-cross</small>
        </div>
        <div className="stat">
          <span>Trade cards</span>
          <strong>{active.concessions.length}</strong>
          <small>Give-to-get moves</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Negotiation scenarios">
        {negotiations.map((n) => (
          <button
            key={n.id}
            type="button"
            role="tab"
            aria-selected={id === n.id}
            className={id === n.id ? "training-tab active" : "training-tab"}
            onClick={() => setId(n.id)}
          >
            {n.label}
          </button>
        ))}
      </div>

      <div className="memory-card">
        <div className="label">Objective · vs. {active.counterparty}</div>
        <p>{active.objective}</p>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Leverage map</h2>
          <div className="list">
            {active.leverage.map((l) => (
              <div className="list-row" key={l.point}>
                <span className={leverageBadge(l.tone)}>
                  {l.tone === "ok" ? "Strong" : "Watch"}
                </span>
                <p>{l.point}</p>
              </div>
            ))}
          </div>

          <div className="confirm-card" style={{ marginTop: "1rem" }}>
            <div className="confirm-prompt">BATNA (best alternative)</div>
            <p>{active.batna}</p>
          </div>

          <h3 style={{ marginTop: "1rem" }}>Redlines</h3>
          <div className="list">
            {active.redlines.map((r) => (
              <div className="list-row" key={r}>
                <span className="badge warn">Hold</span>
                <p>{r}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Give-to-get trades</h2>
          <div className="list">
            {active.concessions.map((c) => (
              <div className="list-row" key={c.give}>
                <span className="badge">Trade</span>
                <p>
                  <strong>Give: {c.give}</strong>
                  <span className="muted-line">Get: {c.get}</span>
                </p>
              </div>
            ))}
          </div>

          <div className="memory-card" style={{ marginTop: "1rem" }}>
            <div className="label">Opening move</div>
            <p>{active.opening}</p>
          </div>

          <h3 style={{ marginTop: "1rem" }}>Traps to avoid</h3>
          <div className="list">
            {active.traps.map((t) => (
              <div className="list-row" key={t}>
                <span className="badge warn">Avoid</span>
                <p>{t}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
