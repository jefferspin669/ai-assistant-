"use client";

import { useMemo, useState } from "react";
import {
  qualityAlertCopy,
  qualityFeedback,
  qualitySignals,
} from "@/lib/atlas-platform";

type Mode = "feedback" | "patterns" | "alerts" | "plan";

const modes: { id: Mode; label: string }[] = [
  { id: "feedback", label: "Feedback" },
  { id: "patterns", label: "Patterns" },
  { id: "alerts", label: "Owner alerts" },
  { id: "plan", label: "Action plan" },
];

export function QualityStudio() {
  const [mode, setMode] = useState<Mode>("patterns");
  const [selectedPattern, setSelectedPattern] = useState("Long wait");
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState<string | null>(null);
  const [planChecks, setPlanChecks] = useState<Record<string, boolean>>({});

  const filteredFeedback = useMemo(
    () =>
      selectedPattern === "All"
        ? qualityFeedback
        : qualityFeedback.filter((item) => item.tags.includes(selectedPattern)),
    [selectedPattern],
  );

  const openAlerts = qualitySignals.filter((signal) => signal.ownerAlert);
  const activeAlertCount = openAlerts.filter((signal) => !acknowledged[signal.id]).length;

  function runScan() {
    setScanning(true);
    setScanNote(null);
    window.setTimeout(() => {
      setScanning(false);
      setScanNote(
        "Scan complete. Five customers mentioned “Long wait.” Owner alert is open.",
      );
      setSelectedPattern("Long wait");
      setMode("alerts");
    }, 700);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Feedback read</span>
          <strong>{qualityFeedback.length}</strong>
          <small>This week</small>
        </div>
        <div className="stat">
          <span>Patterns</span>
          <strong>{qualitySignals.length}</strong>
          <small>Detected</small>
        </div>
        <div className="stat">
          <span>Owner alerts</span>
          <strong>{activeAlertCount}</strong>
          <small>Needs attention</small>
        </div>
        <div className="stat">
          <span>Top issue</span>
          <strong>Long wait</strong>
          <small>5 mentions</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Quality control modes">
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
            {item.id === "alerts" && activeAlertCount > 0 ? (
              <span className="hub-tab-count">{activeAlertCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      {mode === "feedback" ? (
        <div className="split">
          <section className="panel">
            <div className="train-head">
              <div>
                <h2>Customer feedback</h2>
                <p className="panel-lead">Atlas reads reviews, texts, emails, and call summaries.</p>
              </div>
              <button className="btn btn-dark" type="button" onClick={runScan} disabled={scanning}>
                {scanning ? "Scanning…" : "Scan feedback"}
              </button>
            </div>
            <div className="quality-filter-row">
              {["All", ...qualitySignals.map((signal) => signal.pattern)].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={selectedPattern === tag ? "training-tab active" : "training-tab"}
                  onClick={() => setSelectedPattern(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className="list" style={{ marginTop: "0.9rem" }}>
              {filteredFeedback.map((item) => (
                <div className="list-row" key={item.id}>
                  <span className="badge">{item.channel}</span>
                  <div>
                    <p>
                      <strong>{item.customer}</strong>
                      <span className="muted-line"> · {item.when}</span>
                    </p>
                    <p>“{item.quote}”</p>
                    <small className="muted-line">{item.tags.join(" · ")}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>What Atlas looks for</h2>
            <div className="list">
              {[
                "Repeated phrases across channels",
                "Sentiment shifts after delays",
                "Praise patterns worth reinforcing",
                "Threshold breaches that need an owner alert",
              ].map((item) => (
                <div className="list-row" key={item}>
                  <span className="badge ok">Listen</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
            {scanNote ? <p className="muted-line" style={{ marginTop: "1rem" }}>{scanNote}</p> : null}
          </section>
        </div>
      ) : null}

      {mode === "patterns" ? (
        <section className="panel">
          <h2>Detected patterns</h2>
          <p className="panel-lead">
            Example: five customers mention “Long wait.” Atlas clusters the phrase and raises severity.
          </p>
          <div className="quality-pattern-grid">
            {qualitySignals.map((signal) => (
              <button
                key={signal.id}
                type="button"
                className={
                  selectedPattern === signal.pattern
                    ? "quality-pattern-card active"
                    : "quality-pattern-card"
                }
                onClick={() => {
                  setSelectedPattern(signal.pattern);
                  setMode(signal.ownerAlert ? "alerts" : "feedback");
                }}
              >
                <div className="train-head">
                  <h3 style={{ marginBottom: 0 }}>{signal.pattern}</h3>
                  <span
                    className={`badge${
                      signal.severity === "Positive" ? " ok" : signal.severity === "High" ? " warn" : ""
                    }`}
                  >
                    {signal.count}×
                  </span>
                </div>
                <p className="muted-line" style={{ marginTop: "0.45rem" }}>
                  {signal.severity} · {signal.trend}
                </p>
                <p style={{ marginTop: "0.55rem" }}>{signal.recommendation}</p>
                {signal.ownerAlert ? (
                  <small className="muted-line">Owner alert open</small>
                ) : (
                  <small className="muted-line">Monitoring only</small>
                )}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "alerts" ? (
        <div className="split">
          <section className="panel">
            <h2>{qualityAlertCopy.title}</h2>
            <div className="chat-mock">
              <div className="bubble bubble-ai">{qualityAlertCopy.body}</div>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Evidence</div>
              <p>
                {qualityFeedback.filter((item) => item.tags.includes("Long wait")).length} feedback
                items tagged “Long wait” this week.
              </p>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => {
                  setAcknowledged((prev) => ({ ...prev, "long-wait": true }));
                  setMode("plan");
                }}
              >
                Acknowledge & open plan
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setSelectedPattern("Long wait");
                  setMode("feedback");
                }}
              >
                View mentions
              </button>
            </div>
            {acknowledged["long-wait"] ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                Alert acknowledged. Jeff is working the response plan.
              </p>
            ) : null}
          </section>
          <section className="panel">
            <h2>Alert queue</h2>
            <div className="list">
              {openAlerts.map((signal) => (
                <div className="list-row" key={signal.id}>
                  <span className={`badge${acknowledged[signal.id] ? " ok" : " warn"}`}>
                    {acknowledged[signal.id] ? "Seen" : "Open"}
                  </span>
                  <div>
                    <p>
                      <strong>{signal.pattern}</strong> · {signal.count} mentions
                    </p>
                    <small className="muted-line">{signal.recommendation}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {mode === "plan" ? (
        <section className="panel">
          <h2>Response plan · Long wait</h2>
          <p className="panel-lead">
            Atlas drafts the highest-impact fixes. Check them off as you roll them out.
          </p>
          <div className="list">
            {qualityAlertCopy.actions.map((action) => (
              <label className="quality-check-row" key={action}>
                <input
                  type="checkbox"
                  checked={Boolean(planChecks[action])}
                  onChange={(e) =>
                    setPlanChecks((prev) => ({ ...prev, [action]: e.target.checked }))
                  }
                />
                <span>{action}</span>
              </label>
            ))}
          </div>
          <p className="muted-line" style={{ marginTop: "1rem" }}>
            {Object.values(planChecks).filter(Boolean).length}/{qualityAlertCopy.actions.length}{" "}
            actions in progress
          </p>
        </section>
      ) : null}
    </div>
  );
}
