"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { riskCenterAlerts } from "@/lib/atlas-platform";
import {
  createRiskItem,
  enrichRisk,
  loadRiskItems,
  saveRiskItems,
  type RiskItem,
} from "@/lib/ops-workspace";

export function RiskCenterStudio() {
  const seeded = useMemo(() => riskCenterAlerts.map(enrichRisk), []);
  const [custom, setCustom] = useState<RiskItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>(riskCenterAlerts[0].id);
  const [acked, setAcked] = useState<Record<string, boolean>>({});
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setCustom(loadRiskItems());
  }, []);

  const all = [...custom, ...seeded];
  const selected = all.find((alert) => alert.id === selectedId) ?? all[0];
  const openHigh = all.filter((alert) => alert.severity === "High" && !acked[alert.id]).length;

  function persist(next: RiskItem[]) {
    setCustom(next);
    saveRiskItems(next);
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const item = createRiskItem({ title, detail, severity });
    persist([item, ...custom]);
    setSelectedId(item.id);
    setTitle("");
    setDetail("");
    setNote(`Added risk “${item.title}”.`);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Open risks</span>
          <strong>{all.length - Object.values(acked).filter(Boolean).length}</strong>
          <small>Across the business</small>
        </div>
        <div className="stat">
          <span>High severity</span>
          <strong>{openHigh}</strong>
          <small>Need attention</small>
        </div>
        <div className="stat">
          <span>Watching</span>
          <strong>{all.length}</strong>
          <small>Before they get expensive</small>
        </div>
      </div>
      {note ? <p className="muted-line">{note}</p> : null}

      <div className="split">
        <section className="panel">
          <h2>Risk feed</h2>
          <div className="list">
            {all.map((alert) => (
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
                  {acked[alert.id] ? "Acked" : reminded[alert.id] ? "Later" : alert.severity}
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

          <h3 style={{ marginTop: "1rem" }}>Add risk</h3>
          <form className="form-grid" onSubmit={onAdd}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Severity
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label>
              Detail
              <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} />
            </label>
            <button className="btn btn-dark" type="submit">
              Add risk
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>{selected.title}</h2>
          <p className="panel-lead">{selected.detail}</p>

          <h3 style={{ marginTop: "1rem" }}>Risk details</h3>
          <div className="list">
            <div className="list-row">
              <span className="badge">{selected.category}</span>
              <p>Category</p>
            </div>
            <div className="list-row">
              <span className={`badge${selected.severity === "High" ? " warn" : ""}`}>
                {selected.severity}
              </span>
              <p>Severity</p>
            </div>
            <div className="list-row">
              <span className="badge warn">Impact</span>
              <p>{selected.impact}</p>
            </div>
            <div className="list-row">
              <span className="badge">Likelihood</span>
              <p>{selected.likelihood}</p>
            </div>
            <div className="list-row">
              <span className="badge ok">Timeline</span>
              <p>{selected.timeline}</p>
            </div>
          </div>

          <div className="confirm-card" style={{ marginTop: "0.9rem" }}>
            <div className="agent-tag">Recommended action</div>
            <p>{selected.action}</p>
            {!acked[selected.id] ? (
              <div className="cta-row">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => {
                    setAcked((prev) => ({ ...prev, [selected.id]: true }));
                    setNote(`Atlas is handling “${selected.title}”.`);
                  }}
                >
                  Let Atlas handle it
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => {
                    setReminded((prev) => ({ ...prev, [selected.id]: true }));
                    setNote(`Reminder set for “${selected.title}”.`);
                  }}
                >
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
