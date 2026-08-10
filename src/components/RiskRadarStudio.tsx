"use client";

import { useMemo, useState } from "react";
import {
  radarByCategory,
  radarSignals,
  riskCategories,
  type RiskCategoryId,
  type Tone,
} from "@/lib/executive-suite";

type Filter = RiskCategoryId | "all";

function sevBadge(tone: Tone) {
  if (tone === "bad") return "badge warn";
  if (tone === "warn") return "badge";
  return "badge ok";
}

function sevLabel(tone: Tone) {
  if (tone === "bad") return "Critical";
  if (tone === "warn") return "Elevated";
  return "Low";
}

export function RiskRadarStudio() {
  const [filter, setFilter] = useState<Filter>("all");
  const signals = useMemo(() => radarByCategory(filter), [filter]);
  const critical = radarSignals.filter((s) => s.severity === "bad").length;
  const rising = radarSignals.filter((s) => s.trend === "Rising").length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Signals tracked</span>
          <strong>{radarSignals.length}</strong>
          <small>Across every company</small>
        </div>
        <div className="stat">
          <span>Critical</span>
          <strong>{critical}</strong>
          <small>Need action now</small>
        </div>
        <div className="stat">
          <span>Rising</span>
          <strong>{rising}</strong>
          <small>Trend worsening</small>
        </div>
        <div className="stat">
          <span>Categories</span>
          <strong>{riskCategories.length}</strong>
          <small>Domains monitored</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Risk categories">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          className={filter === "all" ? "training-tab active" : "training-tab"}
          onClick={() => setFilter("all")}
        >
          All ({radarSignals.length})
        </button>
        {riskCategories.map((c) => {
          const count = radarSignals.filter((s) => s.category === c.id).length;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={filter === c.id}
              className={filter === c.id ? "training-tab active" : "training-tab"}
              onClick={() => setFilter(c.id)}
            >
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      <section className="panel">
        <h2>
          {filter === "all"
            ? "All signals"
            : riskCategories.find((c) => c.id === filter)?.label}
        </h2>
        <div className="list">
          {signals.map((s) => (
            <div className="list-row" key={s.id}>
              <span className={sevBadge(s.severity)}>{sevLabel(s.severity)}</span>
              <p>
                <strong>{s.title}</strong>
                <span className="muted-line">
                  {s.company} · {s.region} · {s.trend}
                </span>
                <span className="muted-line">{s.detail}</span>
                <span className="muted-line">
                  <strong>Action:</strong> {s.action}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
