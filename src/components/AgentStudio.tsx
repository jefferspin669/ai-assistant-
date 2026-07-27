"use client";

import { FormEvent, useMemo, useState } from "react";
import { agentGoals } from "@/lib/atlas-platform";
import { teamAi } from "@/lib/data";

type Mode = "goals" | "run" | "roster";

const modes: { id: Mode; label: string }[] = [
  { id: "goals", label: "Active goals" },
  { id: "run", label: "Run a goal" },
  { id: "roster", label: "Agent roster" },
];

function planForGoal(prompt: string) {
  const q = prompt.toLowerCase();
  if (q.includes("second location") || q.includes("open a second")) {
    return agentGoals[0];
  }
  if (q.includes("tuesday") || q.includes("fill")) {
    return agentGoals[1];
  }
  if (q.includes("wait") || q.includes("quality")) {
    return agentGoals[2];
  }
  return {
    id: "custom",
    goal: prompt,
    status: "Planned",
    progress: 10,
    atlas: "Atlas drafted a checklist, owners, and update cadence from Brain.",
    steps: [
      { label: "Create checklist", done: true },
      { label: "Estimate costs / effort", done: false },
      { label: "Assign owners", done: false },
      { label: "Track milestones", done: false },
      { label: "Keep owner updated", done: false },
    ],
  };
}

export function AgentStudio() {
  const [mode, setMode] = useState<Mode>("goals");
  const [selectedId, setSelectedId] = useState<string>(agentGoals[0].id);
  const [input, setInput] = useState("Open a second location.");
  const [launched, setLaunched] = useState<ReturnType<typeof planForGoal> | null>(null);
  const [stepDone, setStepDone] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);

  const selected = useMemo(
    () => agentGoals.find((goal) => goal.id === selectedId) ?? agentGoals[0],
    [selectedId],
  );

  const active = launched ?? selected;

  function launch(prompt: string) {
    const plan = planForGoal(prompt.trim() || "Open a second location.");
    setLaunched(plan);
    if (agentGoals.some((goal) => goal.id === plan.id)) {
      setSelectedId(plan.id);
    }
    setStepDone(
      Object.fromEntries(plan.steps.map((step, index) => [`${plan.id}:${index}`, step.done])),
    );
    setNote(`Goal launched: “${plan.goal}”. Atlas is completing work, not just answering.`);
    setMode("run");
  }

  function onLaunch(e: FormEvent) {
    e.preventDefault();
    launch(input);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Active goals</span>
          <strong>{agentGoals.length}</strong>
          <small>Being completed</small>
        </div>
        <div className="stat">
          <span>Agents online</span>
          <strong>{teamAi.length}</strong>
          <small>Specialists</small>
        </div>
        <div className="stat">
          <span>Mode</span>
          <strong>Goals</strong>
          <small>Not just Q&A</small>
        </div>
        <div className="stat">
          <span>Owner updates</span>
          <strong>Auto</strong>
          <small>Every Friday brief</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="AI Agents modes">
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

      {mode === "goals" ? (
        <div className="split">
          <section className="panel">
            <h2>Goals in motion</h2>
            <p className="panel-lead">Instead of answering questions — Atlas completes goals.</p>
            <div className="list">
              {agentGoals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  className={selectedId === goal.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => {
                    setSelectedId(goal.id);
                    setLaunched(null);
                  }}
                >
                  <span className={`badge${goal.status === "Ready" ? " ok" : " warn"}`}>
                    {goal.progress}%
                  </span>
                  <div>
                    <p>
                      <strong>{goal.goal}</strong>
                    </p>
                    <small className="muted-line">{goal.status}</small>
                    <div className="train-track" aria-hidden>
                      <div className="train-fill" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>{selected.goal}</h2>
            <p className="panel-lead">{selected.atlas}</p>
            <div className="list">
              {selected.steps.map((step, index) => (
                <div className="list-row" key={step.label}>
                  <span className={`badge${step.done ? " ok" : ""}`}>
                    {step.done ? "Done" : "Next"}
                  </span>
                  <p>{step.label}</p>
                </div>
              ))}
            </div>
            <div className="train-actions">
              <button className="btn btn-dark" type="button" onClick={() => launch(selected.goal)}>
                Open goal runner
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {mode === "run" ? (
        <div className="split">
          <section className="panel">
            <h2>Run a goal</h2>
            <p className="panel-lead">
              Example: “Open a second location.” Atlas creates a checklist, estimates costs,
              coordinates permits, tracks milestones, orders equipment, and keeps the owner updated.
            </p>
            <form onSubmit={onLaunch} className="train-form">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Open a second location.'
              />
              <button className="btn btn-dark" type="submit">
                Launch
              </button>
            </form>
            <div className="list" style={{ marginTop: "1rem" }}>
              {agentGoals.map((goal) => (
                <div className="list-row" key={goal.id}>
                  <span className="badge">Try</span>
                  <button type="button" className="linkish" onClick={() => {
                    setInput(goal.goal);
                    launch(goal.goal);
                  }}>
                    {goal.goal}
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>{active.goal}</h2>
            <div className="train-track tall" aria-hidden>
              <div className="train-fill" style={{ width: `${active.progress}%` }} />
            </div>
            <p className="panel-lead" style={{ marginTop: "0.75rem" }}>
              {active.atlas}
            </p>
            <div className="list">
              {active.steps.map((step, index) => {
                const key = `${active.id}:${index}`;
                const done = stepDone[key] ?? step.done;
                return (
                  <label className="quality-check-row" key={key}>
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={(e) =>
                        setStepDone((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                    />
                    <span>{step.label}</span>
                  </label>
                );
              })}
            </div>
            {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
          </section>
        </div>
      ) : null}

      {mode === "roster" ? (
        <section className="panel">
          <h2>Agent roster</h2>
          <div className="employee-grid">
            {teamAi.map((agent) => (
              <div className="store-card" key={agent.name} style={{ cursor: "default" }}>
                <h3>{agent.name}</h3>
                <p className="panel-lead">{agent.role}</p>
                <p>{agent.focus}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
