"use client";

import { useMemo, useState } from "react";
import { twinLayers, twinSimulations } from "@/lib/atlas-platform";

type Mode = "model" | "simulate";

const modes: { id: Mode; label: string }[] = [
  { id: "model", label: "Live model" },
  { id: "simulate", label: "Simulate" },
];

export function TwinStudio() {
  const [mode, setMode] = useState<Mode>("model");
  const [selectedLayer, setSelectedLayer] = useState<string>(twinLayers[0].id);
  const [simulationId, setSimulationId] = useState<string>(twinSimulations[0].id);
  const [running, setRunning] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);

  const selected = useMemo(
    () => twinLayers.find((layer) => layer.id === selectedLayer) ?? twinLayers[0],
    [selectedLayer],
  );

  const simulation = useMemo(
    () => twinSimulations.find((item) => item.id === simulationId) ?? twinSimulations[0],
    [simulationId],
  );

  const result = resultId
    ? twinSimulations.find((item) => item.id === resultId) ?? null
    : null;

  function runSimulation(id: string) {
    setSimulationId(id);
    setMode("simulate");
    setRunning(true);
    setResultId(null);
    window.setTimeout(() => {
      setRunning(false);
      setResultId(id);
    }, 700);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Layers</span>
          <strong>{twinLayers.length}</strong>
          <small>Live digital model</small>
        </div>
        <div className="stat">
          <span>Performance</span>
          <strong>86</strong>
          <small>Intelligence Score</small>
        </div>
        <div className="stat">
          <span>Locations</span>
          <strong>1 + #2</strong>
          <small>#2 at 38%</small>
        </div>
        <div className="stat">
          <span>Simulations</span>
          <strong>{twinSimulations.length}</strong>
          <small>Try before you decide</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Digital Twin modes">
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

      {mode === "model" ? (
        <div className="split">
          <section className="panel">
            <h2>Live digital model</h2>
            <p className="panel-lead">
              Employees, customers, inventory, cash flow, marketing, equipment, locations, and
              performance — updated continuously.
            </p>
            <div className="create-type-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {twinLayers.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  className={
                    selectedLayer === layer.id ? "quality-pattern-card active" : "quality-pattern-card"
                  }
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <div className="train-head">
                    <h3 style={{ marginBottom: 0 }}>{layer.layer}</h3>
                    <span className="badge">{layer.value}</span>
                  </div>
                  <p className="muted-line" style={{ marginTop: "0.45rem" }}>
                    {layer.signal}
                  </p>
                  <div className="train-track" aria-hidden>
                    <div className="train-fill" style={{ width: `${layer.value}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>{selected.layer}</h2>
            <div className="memory-card">
              <div className="label">Live signal</div>
              <p>{selected.signal}</p>
            </div>
            <div className="train-actions">
              <button className="btn btn-dark" type="button" onClick={() => setMode("simulate")}>
                Simulate a change
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {mode === "simulate" ? (
        <div className="split">
          <section className="panel">
            <h2>Simulate before you decide</h2>
            <div className="list">
              {twinSimulations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={simulationId === item.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setSimulationId(item.id)}
                >
                  <span className="badge">What if</span>
                  <p>{item.prompt}</p>
                </button>
              ))}
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                disabled={running}
                onClick={() => runSimulation(simulation.id)}
              >
                {running ? "Running model…" : "Run simulation"}
              </button>
            </div>
          </section>
          <section className="panel">
            <h2>Projection</h2>
            {running ? (
              <p className="panel-lead">Replaying the twin across people, money, inventory, and demand…</p>
            ) : result ? (
              <>
                <div className="chat-mock">
                  <div className="bubble bubble-user">{result.prompt}</div>
                  <div className="bubble bubble-ai">{result.result}</div>
                </div>
                <div className="stat-grid metrics-dense" style={{ marginTop: "1rem" }}>
                  {result.deltas.map((delta) => (
                    <div className="stat" key={delta.label}>
                      <span>{delta.label}</span>
                      <strong>{delta.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="panel-lead">Pick a scenario and run it against the live model.</p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
