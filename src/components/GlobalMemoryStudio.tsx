"use client";

import { useMemo, useState } from "react";
import { globalBusinessRegions } from "@/lib/atlas-platform";

const lenses = [
  { key: "language", label: "Languages" },
  { key: "timezone", label: "Time zones" },
  { key: "tax", label: "Tax considerations" },
  { key: "hours", label: "Regional business hours" },
  { key: "holidays", label: "Local holidays" },
  { key: "currency", label: "Currency display" },
  { key: "regulations", label: "Local regulations" },
] as const;

export function GlobalMemoryStudio() {
  const [regionId, setRegionId] = useState<string>(globalBusinessRegions[0].id);
  const [activeLens, setActiveLens] = useState<(typeof lenses)[number]["key"]>("language");

  const region = useMemo(
    () => globalBusinessRegions.find((item) => item.id === regionId) ?? globalBusinessRegions[0],
    [regionId],
  );

  const lensValue = useMemo(() => {
    switch (activeLens) {
      case "language":
        return region.language;
      case "timezone":
        return region.timezone;
      case "tax":
        return region.tax;
      case "hours":
        return region.hours;
      case "holidays":
        return region.holidays.join(" · ");
      case "currency":
        return region.currency;
      case "regulations":
        return region.regulations;
      default:
        return "";
    }
  }, [activeLens, region]);

  const reviewNeeded = region.humanReview && (activeLens === "regulations" || activeLens === "tax");

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Regions</span>
          <strong>{globalBusinessRegions.length}</strong>
          <small>In this company memory</small>
        </div>
        <div className="stat">
          <span>Active</span>
          <strong>{region.country}</strong>
          <small>{region.city}</small>
        </div>
        <div className="stat">
          <span>Currency</span>
          <strong>{region.currency.split(" ")[0]}</strong>
          <small>Local display</small>
        </div>
        <div className="stat">
          <span>Human review</span>
          <strong>{region.humanReview ? "On" : "Off"}</strong>
          <small>Where regulations require it</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Operating countries</h2>
          <p className="panel-lead">
            Atlas keeps languages, time zones, tax, hours, holidays, currency, and local rules per
            market.
          </p>
          <div className="list" style={{ marginTop: "0.85rem" }}>
            {globalBusinessRegions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={regionId === item.id ? "compliance-row active" : "compliance-row"}
                onClick={() => setRegionId(item.id)}
              >
                <span className={`badge${item.humanReview ? " warn" : " ok"}`}>
                  {item.humanReview ? "Review" : "Auto"}
                </span>
                <div>
                  <p>
                    <strong>
                      {item.city} · {item.country}
                    </strong>
                  </p>
                  <small className="muted-line">
                    {item.language} · {item.currency}
                  </small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>
            {region.city} · {region.country}
          </h2>
          <div className="quality-filter-row" style={{ marginBottom: "0.85rem" }}>
            {lenses.map((lens) => (
              <button
                key={lens.key}
                type="button"
                className={activeLens === lens.key ? "training-tab active" : "training-tab"}
                onClick={() => setActiveLens(lens.key)}
              >
                {lens.label}
              </button>
            ))}
          </div>

          <div className="memory-card">
            <div className="label">{lenses.find((l) => l.key === activeLens)?.label}</div>
            <p>{lensValue}</p>
            {reviewNeeded ? (
              <p className="muted-line" style={{ marginTop: "0.65rem" }}>
                Flagged for human review before Atlas gives definitive advice in this market.
              </p>
            ) : null}
          </div>

          <div className="chat-mock" style={{ marginTop: "1rem" }}>
            <div className="bubble bubble-user">
              Quote a maintenance plan for a customer in {region.city}.
            </div>
            <div className="bubble bubble-ai">
              Using {region.language}, {region.timezone}, and {region.currency}. Hours:{" "}
              {region.hours}.{" "}
              {reviewNeeded
                ? "Tax/regulation guidance is staged for human review."
                : "Local tax display and holiday calendar applied."}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
