"use client";

import Link from "@/components/SiteLink";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { IntelligenceFlowBanner } from "@/components/IntelligenceFlowBanner";
import { simulateFlowHref } from "@/lib/intelligence-flow";
import {
  MARKET_INTELLIGENCE_TABS,
  resolveMarketIntelligenceTab,
} from "@/lib/intelligence-nav";
import {
  addCompetitor,
  categoryLabel,
  loadAlertPreferences,
  loadCompetitiveAlerts,
  loadCompetitorTimeline,
  loadCompetitors,
  loadIndustryInsights,
  loadIntelligenceFeed,
  loadMarketSignals,
  saveAlertPreferences,
  type AlertPreference,
  type CompetitiveAlert,
  type Competitor,
  type CompetitorTimelineEntry,
} from "@/lib/market-intelligence";

type TabId = (typeof MARKET_INTELLIGENCE_TABS)[number];

function isMarketTab(value: string): value is TabId {
  return (MARKET_INTELLIGENCE_TABS as readonly string[]).includes(value);
}

function MarketIntelligenceStudioInner() {
  const searchParams = useSearchParams();
  const resolved = resolveMarketIntelligenceTab(searchParams.get("tab"));
  const tab: TabId = isMarketTab(resolved) ? resolved : "competitors";

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [timeline, setTimeline] = useState<CompetitorTimelineEntry[]>([]);
  const [prefs, setPrefs] = useState<AlertPreference[]>([]);
  const [alerts, setAlerts] = useState<CompetitiveAlert[]>([]);
  const [industry, setIndustry] = useState(loadIndustryInsights());
  const [signals, setSignals] = useState<CompetitorTimelineEntry[]>([]);
  const [feed, setFeed] = useState(loadIntelligenceFeed());
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setCompetitors(loadCompetitors());
    setTimeline(loadCompetitorTimeline());
    setPrefs(loadAlertPreferences());
    setAlerts(loadCompetitiveAlerts());
    setIndustry(loadIndustryInsights());
    setSignals(loadMarketSignals());
    setFeed(loadIntelligenceFeed());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function onAddCompetitor(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addCompetitor(name, website || "example.com");
    setName("");
    setWebsite("");
    refresh();
    setNote(`Added ${name.trim()} to competitor watchlist.`);
  }

  function togglePref(id: AlertPreference["id"]) {
    const next = prefs.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p));
    setPrefs(next);
    saveAlertPreferences(next);
    setAlerts(loadCompetitiveAlerts());
  }

  return (
    <AppShell
      title="Atlas Market Intelligence"
      subtitle="Competitors, industry context, signals, alerts, and feed — linked to Business Engine simulation."
    >
      <div className="training-studio">
        {tab === "alerts" && alerts.length > 0 ? <IntelligenceFlowBanner activeStep={1} /> : null}

        {note ? (
          <div className="memory-card">
            <div className="label">Atlas</div>
            <p>{note}</p>
          </div>
        ) : null}

        {tab === "competitors" ? (
          <section className="panel">
            <h2>Competitors</h2>
            <form className="form-grid" onSubmit={onAddCompetitor}>
              <label>Company<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Competitor A" /></label>
              <label>Website<input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="competitor.com" /></label>
              <button className="btn btn-dark" type="submit">+ Add Competitor</button>
            </form>
            <div className="list" style={{ marginTop: "1rem" }}>
              {competitors.map((c) => (
                <div key={c.id} className="compliance-row">
                  <p><strong>{c.name}</strong></p>
                  <small className="muted-line">{c.website}</small>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "industry" ? (
          <section className="panel">
            <h2>Industry</h2>
            <div className="list">
              {industry.map((row) => (
                <div key={row.industry} className="compliance-row">
                  <span className="badge ok">{row.signal}</span>
                  <p><strong>{row.industry}</strong></p>
                  <p className="muted-line">{row.insight}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "signals" ? (
          <section className="panel">
            <h2>Market signals</h2>
            <div className="timeline">
              {signals.map((entry) => (
                <div className="timeline-item" key={entry.id}>
                  <span className="badge ok">{categoryLabel(entry.category)}</span>
                  <strong>{entry.competitorName}</strong>
                  <p>{entry.detail}</p>
                  <p className="muted-line">{entry.analysis}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tab === "alerts" ? (
          <>
            <section className="panel">
              <h2>Alert preferences</h2>
              <div className="form-grid">
                {prefs.map((pref) => (
                  <label key={pref.id} className="checkbox-row">
                    <input type="checkbox" checked={pref.enabled} onChange={() => togglePref(pref.id)} />
                    {pref.label}
                  </label>
                ))}
              </div>
            </section>
            {alerts.map((alert) => (
              <section key={alert.id} className="panel">
                <span className="badge warn">Competitive Alert</span>
                <h2>{alert.detail}</h2>
                <p>{alert.analysis}</p>
                <div className="cta-row" style={{ marginTop: "0.75rem" }}>
                  <Link className="btn btn-dark" href={simulateFlowHref(alert.simulatePrompt, "competitor-price")}>
                    Simulate Response
                  </Link>
                  <Link className="btn btn-outline" href="/app/business-engine?tab=overview&flow=market">
                    Model in Business Engine
                  </Link>
                </div>
              </section>
            ))}
          </>
        ) : null}

        {tab === "feed" ? (
          <section className="panel">
            <h2>Intelligence feed</h2>
            <div className="list">
              {feed.map((item) => (
                <div key={item.id} className="compliance-row">
                  <p><strong>{item.title}</strong></p>
                  <p className="muted-line">{item.body}</p>
                </div>
              ))}
            </div>
            <section className="panel" style={{ marginTop: "1rem" }}>
              <h2>Competitor timeline</h2>
              <div className="timeline">
                {timeline.map((entry) => (
                  <div className="timeline-item" key={entry.id}>
                    <strong>{entry.label} — {entry.competitorName}</strong>
                    <p>{entry.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export function MarketIntelligenceStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading Market Intelligence…</p>}>
      <MarketIntelligenceStudioInner />
    </Suspense>
  );
}
