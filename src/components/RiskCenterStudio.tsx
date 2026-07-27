"use client";

import { useMemo, useState } from "react";
import { riskCenterAlerts } from "@/lib/atlas-platform";

export function RiskCenterStudio() {
  const [selectedId, setSelectedId] = useState<string>(riskCenterAlerts[0].id);
  const [acked, setAcked] = useState<Record<string, boolean>>({});

  const selected = useMemo(
    () => riskCenterAlerts.find((alert) => alert.id === selectedId) ?? riskCenterAlerts[0],
    [selectedId],
  );

  const openHigh = riskCenterAlerts.filter((alert) => alert.severity === "High" && !acked[alert.id]).length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Open risks</span>
          <strong>{riskCenterAlerts.length - Object.values(acked).filter(Boolean).length}</strong>
          <small>Across the business</small>
        </div>
        <div className="stat">
          <span>High severity</span>
          <strong>{openHigh}</strong>
          <small>Need attention</small>
        </div>
        <div className="stat">
          <span>Watching</span>
          <strong>{riskCenterAlerts.length}</strong>
          <small>Before they get expensive</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Risk feed</h2>
          <div className="list">
            {riskCenterAlerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                className="list-row"
                onClick={() => setSelectedId(alert.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: selectedId === alert.id ? "var(--paper)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "0.65rem 0.5rem",
                }}
              >
                <span className={`badge ${alert.severity === "High" ? "warn" : ""}`}>
                  {acked[alert.id] ? "Acked" : alert.severity}
                </span>
                <div>
                  <p>
                    <strong>{alert.title}</strong>
                  </p>
                  <small className="muted-line">{alert.category}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{selected.title}</h2>
          <p className="panel-lead">{selected.detail}</p>
          <div className="confirm-card" style={{ marginTop: "0.9rem" }}>
            <div className="agent-tag">Recommended action</div>
            <p>{selected.action}</p>
            {!acked[selected.id] ? (
              <div className="cta-row">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => setAcked((prev) => ({ ...prev, [selected.id]: true }))}
                >
                  Let Atlas handle it
                </button>
                <button className="btn btn-outline" type="button">
                  Remind me later
                </button>
              </div>
            ) : (
              <span className="badge ok">In motion</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
