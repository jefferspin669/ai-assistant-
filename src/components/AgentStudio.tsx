"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { teamAi } from "@/lib/data";
import {
  loadAgentGoals,
  planAgentGoal,
  saveAgentGoals,
  type AgentGoal,
} from "@/lib/user-workspace";

type Mode = "goals" | "run" | "roster";

const modes: { id: Mode; label: string }[] = [
  { id: "goals", label: "Active goals" },
  { id: "run", label: "Run a goal" },
  { id: "roster", label: "Agent roster" },
];

const suggestions = [
  "Open a second location.",
  "Fill next week’s empty Tuesday.",
  "Fix long-wait quality issues.",
];

export function AgentStudio({ launchSignal = 0 }: { launchSignal?: number }) {
  const [mode, setMode] = useState<Mode>("goals");
  const [goals, setGoals] = useState<AgentGoal[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState("Open a second location.");
  const [stepDone, setStepDone] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadAgentGoals();
    setGoals(loaded);
    setSelectedId(loaded[0]?.id ?? null);
    setReady(true);
  }, []);

  useEffect(() => {
    if (launchSignal <= 0) return;
    setMode("run");
    setNote("Describe a goal and press Launch — Atlas will complete work, not just answer.");
  }, [launchSignal]);

  const selected = useMemo(
    () => goals.find((goal) => goal.id === selectedId) ?? null,
    [goals, selectedId],
  );

  function persist(next: AgentGoal[]) {
    setGoals(next);
    saveAgentGoals(next);
  }

  function launch(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) {
      setNote("Enter a goal to launch.");
      setMode("run");
      return;
    }
    const plan = planAgentGoal(trimmed);
    const next = [plan, ...goals];
    persist(next);
    setSelectedId(plan.id);
    setStepDone(
      Object.fromEntries(plan.steps.map((step, index) => [`${plan.id}:${index}`, step.done])),
    );
    setNote(`Goal launched: “${plan.goal}”. Atlas is completing work, not just answering.`);
    setMode("run");
    setInput(plan.goal);
  }

  function onLaunch(e: FormEvent) {
    e.preventDefault();
    launch(input);
  }

  function removeGoal(id: string) {
    const next = goals.filter((goal) => goal.id !== id);
    persist(next);
    setSelectedId(next[0]?.id ?? null);
    setNote("Goal removed.");
  }

  const active = selected;

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Active goals</span>
          <strong>{goals.length}</strong>
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
            <p className="panel-lead">Launch goals — they accumulate here as Atlas works.</p>
            {!ready ? <p className="muted-line">Loading…</p> : null}
            {ready && goals.length === 0 ? (
              <p className="muted-line">No goals yet. Use Launch goal to start one.</p>
            ) : (
              <div className="list">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    className={selectedId === goal.id ? "compliance-row active" : "compliance-row"}
                    onClick={() => setSelectedId(goal.id)}
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
            )}
          </section>
          <section className="panel">
            {selected ? (
              <>
                <h2>{selected.goal}</h2>
                <p className="panel-lead">{selected.atlas}</p>
                <div className="list">
                  {selected.steps.map((step) => (
                    <div className="list-row" key={step.label}>
                      <span className={`badge${step.done ? " ok" : ""}`}>
                        {step.done ? "Done" : "Next"}
                      </span>
                      <p>{step.label}</p>
                    </div>
                  ))}
                </div>
                <div className="train-actions">
                  <button
                    className="btn btn-dark"
                    type="button"
                    onClick={() => {
                      setInput(selected.goal);
                      setMode("run");
                    }}
                  >
                    Open goal runner
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => removeGoal(selected.id)}
                  >
                    Remove
                  </button>
                </div>
              </>
            ) : (
              <p className="muted-line">Launch a goal to see steps and progress.</p>
            )}
          </section>
        </div>
      ) : null}

      {mode === "run" ? (
        <div className="split">
          <section className="panel">
            <h2>Run a goal</h2>
            <p className="panel-lead">
              Example: “Open a second location.” Atlas creates a checklist, estimates costs,
              coordinates permits, tracks milestones, and keeps the owner updated.
            </p>
            <form onSubmit={onLaunch} className="train-form">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Open a second location."
              />
              <button className="btn btn-dark" type="submit">
                Launch
              </button>
            </form>
            <div className="list" style={{ marginTop: "1rem" }}>
              {suggestions.map((goal) => (
                <div className="list-row" key={goal}>
                  <span className="badge">Try</span>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      setInput(goal);
                      launch(goal);
                    }}
                  >
                    {goal}
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            {active ? (
              <>
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
              </>
            ) : (
              <p className="muted-line">Launch a goal to track checklist progress here.</p>
            )}
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
