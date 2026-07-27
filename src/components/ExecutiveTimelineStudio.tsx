"use client";

import { useMemo, useState } from "react";
import {
  executiveTimeline,
  executiveTimelineCategories,
} from "@/lib/atlas-platform";

type Mode = "timeline" | "categories" | "upcoming";

const modes: { id: Mode; label: string }[] = [
  { id: "timeline", label: "One timeline" },
  { id: "categories", label: "By category" },
  { id: "upcoming", label: "Upcoming" },
];

function categoryTone(category: string) {
  if (category === "Lawsuits" || category === "Compliance deadlines") return "warn";
  if (category === "Funding" || category === "Revenue milestones") return "ok";
  return "";
}

export function ExecutiveTimelineStudio() {
  const [mode, setMode] = useState<Mode>("timeline");
  const [filter, setFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    const items = [...executiveTimeline].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (filter === "All") return items;
    return items.filter((item) => item.category === filter);
  }, [filter]);

  const upcoming = useMemo(
    () =>
      [...executiveTimeline]
        .filter((item) => item.date >= "2026-04-01")
        .sort((a, b) => (a.date > b.date ? 1 : -1)),
    [],
  );

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const cat of executiveTimelineCategories) map.set(cat, 0);
    for (const item of executiveTimeline) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return map;
  }, []);

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Events</span>
          <strong>{executiveTimeline.length}</strong>
          <small>Everything important</small>
        </div>
        <div className="stat">
          <span>Categories</span>
          <strong>{executiveTimelineCategories.length}</strong>
          <small>One shared spine</small>
        </div>
        <div className="stat">
          <span>Upcoming</span>
          <strong>{upcoming.length}</strong>
          <small>From Apr 2026</small>
        </div>
        <div className="stat">
          <span>Filter</span>
          <strong>{filter === "All" ? "All" : "1"}</strong>
          <small>{filter}</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Executive timeline modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "timeline" ? (
        <section className="panel">
          <h2>Executive timeline</h2>
          <p className="panel-lead">
            Funding, hiring, customers, lawsuits, launches, revenue, equipment, acquisitions,
            compliance — one timeline.
          </p>
          <div className="training-tabs" style={{ margin: "0.85rem 0 1rem" }}>
            <button
              type="button"
              className={filter === "All" ? "training-tab active" : "training-tab"}
              onClick={() => setFilter("All")}
            >
              All
            </button>
            {executiveTimelineCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={filter === cat ? "training-tab active" : "training-tab"}
                onClick={() => setFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="timeline exec-timeline">
            {filtered.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div className="timeline-meta">
                  <span className="time">{item.date}</span>
                  <span className={`badge ${categoryTone(item.category)}`}>{item.category}</span>
                </div>
                <strong>{item.title}</strong>
                <p className="muted-line">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "categories" ? (
        <section className="panel">
          <h2>Coverage by category</h2>
          <div className="pack-grid dense" style={{ marginTop: "1rem" }}>
            {executiveTimelineCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className="store-card"
                onClick={() => {
                  setFilter(cat);
                  setMode("timeline");
                }}
              >
                <strong>{cat}</strong>
                <span className="muted-line">{counts.get(cat) ?? 0} events on the spine</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "upcoming" ? (
        <section className="panel">
          <h2>Coming up</h2>
          <p className="panel-lead">Deadlines and commitments Atlas is watching next.</p>
          <div className="timeline exec-timeline" style={{ marginTop: "1rem" }}>
            {upcoming.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div className="timeline-meta">
                  <span className="time">{item.date}</span>
                  <span className={`badge ${categoryTone(item.category)}`}>{item.category}</span>
                </div>
                <strong>{item.title}</strong>
                <p className="muted-line">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
