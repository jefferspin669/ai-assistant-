"use client";

import { useMemo, useState } from "react";
import { simulatorScenarios } from "@/lib/atlas-platform";

export function SimulatorStudio() {
  const [scenarioId, setScenarioId] = useState<string>(simulatorScenarios[0].id);
  const [customPrompt, setCustomPrompt] = useState("What happens if minimum wage increases?");
  const [running, setRunning] = useState(false);
  const [resultId, setResultId] = useState<string | null>(simulatorScenarios[0].id);

  const scenario = useMemo(
    () => simulatorScenarios.find((item) => item.id === scenarioId) ?? simulatorScenarios[0],
    [scenarioId],
  );

  const result = resultId
    ? simulatorScenarios.find((item) => item.id === resultId) ?? scenario
    : null;

  function run(id: string) {
    setScenarioId(id);
    setRunning(true);
    setResultId(null);
    window.setTimeout(() => {
      setRunning(false);
      setResultId(id);
    }, 700);
  }

  function runCustom() {
    const match = simulatorScenarios.find((item) =>
      customPrompt.toLowerCase().includes("fuel")
        ? item.id === "fuel"
        : customPrompt.toLowerCase().includes("ads")
          ? item.id === "ads"
          : item.id === "min-wage",
    );
    if (match) run(match.id);
  }

  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Business Simulator</p>
          <h2>SimCity — for a real company.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            Ask what happens if wages, fuel, ads, or pricing change. Atlas models payroll, profit,
            hiring, demand, and cash flow before you commit.
          </p>
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Ask Atlas</h2>
          <div className="form-grid">
            <label>
              Scenario
              <input value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} />
            </label>
            <button className="btn btn-dark" type="button" onClick={runCustom}>
              {running ? "Simulating…" : "Run simulation"}
            </button>
          </div>
          <div className="suggestion-row" style={{ marginTop: "0.9rem" }}>
            {simulatorScenarios.map((item) => (
              <button key={item.id} type="button" className="suggestion" onClick={() => run(item.id)}>
                {item.prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Simulation result</h2>
          {running ? (
            <p className="panel-lead">Modeling payroll, pricing, profit, hiring, demand, and cash…</p>
          ) : result ? (
            <>
              <p className="panel-lead">{result.summary}</p>
              <div className="stat-grid metrics-dense" style={{ marginTop: "0.9rem" }}>
                {result.impacts.map((impact) => (
                  <div className="stat" key={impact.label}>
                    <span>{impact.label}</span>
                    <strong style={{ fontSize: "1.15rem" }}>{impact.value}</strong>
                    <small className={impact.tone === "ok" ? "" : ""}>
                      {impact.tone === "ok" ? "Manageable" : "Watch closely"}
                    </small>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
