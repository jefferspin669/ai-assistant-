"use client";

import { useMemo, useState } from "react";
import {
  capitalPlan,
  capitalTiers,
  formatUSD,
  type CapitalTierId,
  type Tone,
} from "@/lib/executive-suite";

function riskBadge(tone: Tone) {
  if (tone === "ok") return "badge ok";
  if (tone === "bad") return "badge warn";
  return "badge";
}

function riskLabel(tone: Tone) {
  if (tone === "ok") return "Lower risk";
  if (tone === "bad") return "Higher risk";
  return "Moderate";
}

export function CapitalAllocationStudio() {
  const [tier, setTier] = useState<CapitalTierId>("10m");
  const plan = useMemo(() => capitalPlan(tier), [tier]);
  const maxPct = Math.max(...plan.rows.map((r) => r.pct));

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Deploying</span>
          <strong>{plan.tier.label.replace("Next ", "")}</strong>
          <small>{plan.tier.horizon}</small>
        </div>
        <div className="stat">
          <span>Posture</span>
          <strong style={{ fontSize: "1rem" }}>{plan.tier.posture}</strong>
          <small>Recommended stance</small>
        </div>
        <div className="stat">
          <span>Top allocation</span>
          <strong style={{ fontSize: "1rem" }}>{plan.rows[0].label.split(" (")[0]}</strong>
          <small>{plan.rows[0].pct}% · {formatUSD(plan.rows[0].dollars)}</small>
        </div>
        <div className="stat">
          <span>Reserve kept</span>
          <strong>
            {plan.rows.find((r) => r.id === "reserves")?.pct ?? 0}%
          </strong>
          <small>Dry powder</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Capital amount">
        {capitalTiers.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tier === t.id}
            className={tier === t.id ? "training-tab active" : "training-tab"}
            onClick={() => setTier(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="split">
        <section className="panel">
          <h2>Recommended allocation</h2>
          <p className="panel-lead">
            How Atlas would split {formatUSD(plan.tier.amount)} across the eight levers.
          </p>
          <div className="bars" style={{ marginTop: "1rem" }}>
            {plan.rows.map((row) => (
              <div className="bar-row" key={row.id}>
                <span title={row.label}>{row.label.split(" (")[0]}</span>
                <span className="bar-track">
                  <span
                    className="bar-fill"
                    style={{ width: `${Math.round((row.pct / maxPct) * 100)}%` }}
                  />
                </span>
                <strong>
                  {row.pct}% · {formatUSD(row.dollars)}
                </strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Why this split</h2>
          <div className="memory-card">
            <div className="label">{plan.tier.label} · {plan.tier.horizon}</div>
            <p>{plan.rationale}</p>
          </div>
          <h3 style={{ marginTop: "1rem" }}>Per-lever detail</h3>
          <div className="list">
            {plan.rows.map((row) => (
              <div className="list-row" key={row.id}>
                <span className={riskBadge(row.risk)}>{formatUSD(row.dollars)}</span>
                <p>
                  <strong>{row.label}</strong>
                  <span className="muted-line">{row.note}</span>
                  <span className="muted-line">
                    Expected return: {row.roi} · {riskLabel(row.risk)}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
