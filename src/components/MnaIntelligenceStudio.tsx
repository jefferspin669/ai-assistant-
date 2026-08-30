"use client";

import { useMemo, useState } from "react";
import {
  acquisitionTargets,
  type Tone,
} from "@/lib/executive-suite";

type Mode = "screen" | "compare";

function fitTone(fit: number): Tone {
  if (fit >= 80) return "ok";
  if (fit >= 68) return "warn";
  return "bad";
}

function sevBadge(tone: Tone) {
  if (tone === "bad") return "badge warn";
  if (tone === "warn") return "badge";
  return "badge ok";
}

function ddBadge(status: string) {
  if (status === "Done") return "badge ok";
  if (status === "In progress") return "badge warn";
  return "badge";
}

export function MnaIntelligenceStudio() {
  const [mode, setMode] = useState<Mode>("screen");
  const [id, setId] = useState(acquisitionTargets[0].id);
  const active = useMemo(
    () => acquisitionTargets.find((t) => t.id === id) ?? acquisitionTargets[0],
    [id],
  );
  const ddDone = active.diligence.filter((d) => d.status === "Done").length;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Targets screened</span>
          <strong>{acquisitionTargets.length}</strong>
          <small>In active pipeline</small>
        </div>
        <div className="stat">
          <span>Strategic fit</span>
          <strong>{active.fit}</strong>
          <small>{active.name}</small>
        </div>
        <div className="stat">
          <span>Red flags</span>
          <strong>{active.redFlags.length}</strong>
          <small>On the selected target</small>
        </div>
        <div className="stat">
          <span>Diligence</span>
          <strong>
            {ddDone}/{active.diligence.length}
          </strong>
          <small>Workstreams complete</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="M&A modes">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "screen"}
          className={mode === "screen" ? "training-tab active" : "training-tab"}
          onClick={() => setMode("screen")}
        >
          Screen target
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "compare"}
          className={mode === "compare" ? "training-tab active" : "training-tab"}
          onClick={() => setMode("compare")}
        >
          Compare all
        </button>
      </div>

      {mode === "screen" ? (
        <div className="split">
          <section className="panel">
            <h2>Pipeline</h2>
            <div className="list">
              {acquisitionTargets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={id === t.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setId(t.id)}
                >
                  <span className={`badge ${fitTone(t.fit)}`}>{t.fit}</span>
                  <p>
                    <strong>{t.name}</strong>
                    <span className="muted-line">{t.sector}</span>
                    <span className="muted-line">
                      {t.revenue} · {t.ask} · {t.stage}
                    </span>
                  </p>
                </button>
              ))}
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Thesis · {active.name}</div>
              <p>{active.thesis}</p>
            </div>
          </section>

          <section className="panel">
            <h2>Synergies modeled</h2>
            <div className="list">
              {active.synergies.map((s) => (
                <div className="list-row" key={s.label}>
                  <span className="badge ok">{s.value}</span>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: "1rem" }}>Red flags</h3>
            <div className="list">
              {active.redFlags.map((f) => (
                <div className="list-row" key={f.label}>
                  <span className={sevBadge(f.severity)}>
                    {f.severity === "bad" ? "High" : "Watch"}
                  </span>
                  <p>{f.label}</p>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: "1rem" }}>Due diligence tracker</h3>
            <div className="list">
              {active.diligence.map((d) => (
                <div className="list-row" key={d.item}>
                  <span className={ddBadge(d.status)}>{d.status}</span>
                  <p>{d.item}</p>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: "1rem" }}>Integration plan</h3>
            <div className="list">
              {active.integration.map((step, i) => (
                <div className="list-row" key={step}>
                  <span className="badge">{i + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="panel">
          <h2>Side-by-side comparison</h2>
          <p className="panel-lead">All active targets on the metrics that decide a deal.</p>
          <div className="pack-grid dense" style={{ marginTop: "1rem" }}>
            {acquisitionTargets.map((t) => (
              <div className="domain-card" key={t.id}>
                <strong>{t.name}</strong>
                <span>{t.sector}</span>
                <span>Revenue {t.revenue} · EBITDA {t.ebitda}</span>
                <span>Ask {t.ask}</span>
                <span>
                  Fit {t.fit} · {t.redFlags.length} red flags · {t.stage}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
