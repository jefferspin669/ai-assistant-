"use client";

import { useMemo, useState } from "react";
import { autonomousLoops } from "@/lib/atlas-platform";

export function AutonomousStudio() {
  const [enabled, setEnabled] = useState(true);
  const [activeId, setActiveId] = useState<string>(autonomousLoops[0].id);
  const [confirmations, setConfirmations] = useState<Record<string, "approved" | "dismissed">>({});
  const [runningStep, setRunningStep] = useState<number>(autonomousLoops[0].steps.length);

  const active = useMemo(
    () => autonomousLoops.find((loop) => loop.id === activeId) ?? autonomousLoops[0],
    [activeId],
  );

  function selectLoop(id: string) {
    setActiveId(id);
    setRunningStep(0);
    const loop = autonomousLoops.find((item) => item.id === id) ?? autonomousLoops[0];
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setRunningStep(step);
      if (step >= loop.steps.length) window.clearInterval(timer);
    }, 280);
  }

  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">AI Autonomous Mode</p>
          <h2>Atlas works continuously.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            It doesn’t wait for commands. Missed calls, CRM updates, technician alerts, reminders,
            and review requests run in loops — you only get confirmations when it matters.
          </p>
        </div>
        <div>
          <button
            className={`btn ${enabled ? "btn-primary" : "btn-outline"}`}
            type="button"
            onClick={() => setEnabled((value) => !value)}
            style={enabled ? undefined : { color: "var(--foam)", borderColor: "rgba(244,248,247,0.35)" }}
          >
            {enabled ? "Autonomous · ON" : "Autonomous · OFF"}
          </button>
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Active loops</h2>
          <div className="list">
            {autonomousLoops.map((loop) => (
              <button
                key={loop.id}
                type="button"
                className="list-row"
                onClick={() => selectLoop(loop.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: activeId === loop.id ? "var(--paper)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "0.65rem 0.5rem",
                }}
              >
                <span className={`badge ${enabled ? "ok" : ""}`}>{enabled ? "Running" : "Paused"}</span>
                <div>
                  <p>
                    <strong>{loop.title}</strong>
                  </p>
                  <small className="muted-line">{loop.trigger}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{active.title}</h2>
          <p className="panel-lead">{active.trigger}</p>
          <div className="list">
            {active.steps.map((step, index) => (
              <div className="list-row" key={step}>
                <span className={`badge ${index < runningStep ? "ok" : ""}`}>
                  {index < runningStep ? "Done" : "Next"}
                </span>
                <p>{step}</p>
              </div>
            ))}
          </div>

          <div className="confirm-card" style={{ marginTop: "1rem" }}>
            <div className="agent-tag">
              Owner confirmation · {active.needsConfirm ? "required" : "FYI only"}
            </div>
            <p>{active.ownerSees}</p>
            {active.needsConfirm && !confirmations[active.id] ? (
              <div className="cta-row">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => setConfirmations((prev) => ({ ...prev, [active.id]: "approved" }))}
                >
                  Confirm
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setConfirmations((prev) => ({ ...prev, [active.id]: "dismissed" }))}
                >
                  Not now
                </button>
              </div>
            ) : (
              <span className={`badge ${confirmations[active.id] === "dismissed" ? "warn" : "ok"}`}>
                {active.needsConfirm
                  ? confirmations[active.id] === "approved"
                    ? "Confirmed"
                    : "Dismissed"
                  : "Logged for owner"}
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
