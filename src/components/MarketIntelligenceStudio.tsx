"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  addCompetitor,
  categoryLabel,
  loadAlertPreferences,
  loadCompetitiveAlerts,
  loadCompetitorTimeline,
  loadCompetitors,
  saveAlertPreferences,
  type AlertPreference,
  type CompetitiveAlert,
  type Competitor,
  type CompetitorTimelineEntry,
} from "@/lib/market-intelligence";

export function MarketIntelligenceStudio() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [timeline, setTimeline] = useState<CompetitorTimelineEntry[]>([]);
  const [prefs, setPrefs] = useState<AlertPreference[]>([]);
  const [alerts, setAlerts] = useState<CompetitiveAlert[]>([]);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setCompetitors(loadCompetitors());
    setTimeline(loadCompetitorTimeline());
    setPrefs(loadAlertPreferences());
    setAlerts(loadCompetitiveAlerts());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
  }, [refresh]);

  function onAddCompetitor(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addCompetitor(name, website || "example.com");
    setName("");
    setWebsite("");
    refresh();
    setNote(`Added ${name.trim()} to competitor watchlist. Atlas will track public signals lawfully available.`);
  }

  function togglePref(id: AlertPreference["id"]) {
    const next = prefs.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    setPrefs(next);
    saveAlertPreferences(next);
    setAlerts(loadCompetitiveAlerts());
  }

  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Atlas Market Intelligence</p>
          <h2>Know what competitors are doing — and what it means for you.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            Atlas maintains competitor profiles from lawfully available public and business-authorized data —
            pricing, hiring, expansion, and news — then connects alerts to the Business Engine simulator.
          </p>
        </div>
      </section>

      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      <div className="split">
        <section className="panel">
          <h2>Competitors</h2>
          <p className="panel-lead">Add companies Atlas should watch.</p>
          <form className="form-grid" onSubmit={onAddCompetitor}>
            <label>
              Company
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Competitor A" />
            </label>
            <label>
              Website
              <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="competitor.com" />
            </label>
            <button className="btn btn-dark" type="submit">+ Add Competitor</button>
          </form>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          <div className="list" style={{ marginTop: "1rem" }}>
            {competitors.map((c) => (
              <div key={c.id} className="compliance-row">
                <div>
                  <p><strong>{c.name}</strong></p>
                  <small className="muted-line">{c.website}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Competitor alerts</h2>
          <p className="panel-lead">Choose what Atlas should notify you about.</p>
          <div className="form-grid">
            {prefs.map((pref) => (
              <label key={pref.id} className="checkbox-row">
                <input type="checkbox" checked={pref.enabled} onChange={() => togglePref(pref.id)} />
                {pref.label}
              </label>
            ))}
          </div>
        </section>
      </div>

      {alerts.map((alert) => (
        <section key={alert.id} className="panel">
          <span className={alert.severity === "high" ? "badge warn" : "badge"}>
            {alert.severity === "high" ? "🔴" : "🟡"} {alert.title}
          </span>
          <h2 style={{ marginTop: "0.5rem" }}>{alert.detail}</h2>
          <p>{alert.analysis}</p>
          <div className="cta-row" style={{ marginTop: "0.75rem" }}>
            <Link
              className="btn btn-dark"
              href={`/app/business-engine?tab=simulate&prompt=${encodeURIComponent(alert.simulatePrompt)}`}
            >
              Simulate Response
            </Link>
          </div>
        </section>
      ))}

      <section className="panel">
        <h2>Competitor timeline</h2>
        <div className="timeline">
          {timeline.map((entry) => (
            <div className="timeline-item" key={entry.id}>
              <span className="badge ok">{categoryLabel(entry.category)}</span>
              <strong>{entry.label} — {entry.competitorName}</strong>
              <p>{entry.detail}</p>
              <p className="muted-line">{entry.analysis}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
