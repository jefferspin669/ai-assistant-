"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import {
  detectQualityAlerts,
  loadQualityDefinitions,
  loadQualityRecords,
  qualityStats,
  saveQualityDefinition,
  type QualityAlert,
} from "@/lib/quality-workspace";

export function QualityStudio() {
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [records, setRecords] = useState(loadQualityRecords());
  const [defs, setDefs] = useState(loadQualityDefinitions());
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const stats = qualityStats();

  useEffect(() => {
    setAlerts(detectQualityAlerts());
    setRecords(loadQualityRecords());
    setDefs(loadQualityDefinitions());
  }, []);

  function onAddDef(e: FormEvent) {
    e.preventDefault();
    if (!customName.trim()) return;
    saveQualityDefinition(customName, customDesc);
    setDefs(loadQualityDefinitions());
    setCustomName("");
    setCustomDesc("");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat"><span>Signals</span><strong>{stats.records}</strong></div>
        <div className="stat"><span>Alerts</span><strong>{stats.alerts}</strong></div>
        <div className="stat"><span>Your definitions</span><strong>{stats.definitions}</strong></div>
      </div>

      {alerts.map((alert) => (
        <section key={alert.id} className="panel">
          <span className={alert.severity === "high" ? "badge warn" : "badge"}>Quality Alert</span>
          <h2>{alert.pattern}</h2>
          <p>{alert.detail}</p>
          <div className="cta-row" style={{ marginTop: "0.75rem" }}>
            <Link className="btn btn-dark" href="/app/customers">View customers</Link>
            <Link className="btn btn-outline" href="/app/workforce?tab=tasks">Find cause</Link>
            <Link className="btn btn-outline" href="/app/projects">Create improvement plan</Link>
          </div>
        </section>
      ))}

      <section className="panel">
        <h2>Signal feed</h2>
        <p className="panel-lead">Complaints, tickets, reviews, refunds, project issues, deliveries, defects, ratings, surveys.</p>
        <div className="list">
          {records.slice(0, 12).map((r) => (
            <div key={r.id} className="list-row">
              <span className="badge">{r.source}</span>
              <div>
                {r.customer ? <strong>{r.customer}</strong> : null}
                <p>{r.text}</p>
                <small className="muted-line">{r.tags.join(" · ")}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>What quality means here</h2>
        <ul className="plain-list">
          {defs.map((d) => (
            <li key={d.id}><strong>{d.name}</strong> — {d.description}</li>
          ))}
        </ul>
        <form className="form-grid" onSubmit={onAddDef} style={{ marginTop: "1rem" }}>
          <label>Metric<input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Delivery times" /></label>
          <label>Definition<input value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} placeholder="What good looks like" /></label>
          <button className="btn btn-outline" type="submit">+ Add quality metric</button>
        </form>
      </section>
    </div>
  );
}
