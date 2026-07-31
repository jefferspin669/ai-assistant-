"use client";

import { useState } from "react";
import { businessBuilderSteps } from "@/lib/atlas-platform";

export function BusinessBuilderStudio() {
  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<Record<string, boolean>>({
    name: true,
    brand: true,
    website: true,
  });

  const step = businessBuilderSteps[stepIndex];
  const doneCount = businessBuilderSteps.filter((item) => completed[item.id]).length;

  function completeCurrent() {
    setCompleted((prev) => ({ ...prev, [step.id]: true }));
    setStepIndex((index) => Math.min(index + 1, businessBuilderSteps.length - 1));
  }

  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">AI Business Builder</p>
          <h2>From idea to first customers.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            Atlas helps new entrepreneurs generate plans, logos, websites, domains, contracts,
            marketing, accounting, and online stores — then launch.
          </p>
        </div>
        <div className="stat" style={{ background: "rgba(244,248,247,0.08)", border: "none" }}>
          <span style={{ color: "rgba(244,248,247,0.7)" }}>Launch progress</span>
          <strong style={{ color: "var(--foam)" }}>
            {doneCount}/{businessBuilderSteps.length}
          </strong>
          <small style={{ color: "#9ed0b2" }}>Steps complete</small>
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Launch checklist</h2>
          <div className="list">
            {businessBuilderSteps.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="list-row"
                onClick={() => setStepIndex(index)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: stepIndex === index ? "var(--paper)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 12,
                  padding: "0.65rem 0.5rem",
                }}
              >
                <span className={`badge ${completed[item.id] ? "ok" : ""}`}>
                  {completed[item.id] ? "Done" : index + 1}
                </span>
                <div>
                  <p>
                    <strong>{item.title}</strong>
                  </p>
                  <small className="muted-line">{item.detail}</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{step.title}</h2>
          <p className="panel-lead">{step.detail}</p>
          <div className="chat-mock" style={{ marginTop: "0.85rem" }}>
            <div className="bubble bubble-user">Help me start my company.</div>
            <div className="bubble bubble-ai">
              Let’s build {step.title.toLowerCase()} next. I’ll keep your Business DNA, website,
              and workflows aligned as we go.
            </div>
          </div>
          <div className="cta-row" style={{ marginTop: "1rem" }}>
            <button className="btn btn-dark" type="button" onClick={completeCurrent}>
              {completed[step.id] ? "Next step" : "Generate with Atlas"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
            >
              Back
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
