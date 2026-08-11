"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  createGoal,
  formatGoalValue,
  goalPct,
  loadGoals,
  loadTeamMembers,
  saveGoals,
  seedDemoTeamIfEmpty,
  updateGoalProgress,
  type EmployeeGoal,
  type GoalKind,
  type TeamPerson,
} from "@/lib/user-workspace";

export function GoalsStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<GoalKind>("amount");
  const [target, setTarget] = useState("50000");
  const [current, setCurrent] = useState("0");
  const [unit, setUnit] = useState("");
  const [period, setPeriod] = useState("This month");

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setGoals(loadGoals());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setMemberId((prev) => prev || loadTeamMembers()[0]?.id || "");
  }, [refresh]);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const member = members.find((m) => m.id === memberId);
    const goal = createGoal({
      memberId,
      department: member?.department,
      title,
      kind,
      target: Number(target) || 1,
      current: Number(current) || 0,
      unit,
      period,
    });
    saveGoals([goal, ...loadGoals()]);
    refresh();
    setNote(`Goal "${goal.title}" assigned to ${member?.name ?? "employee"}.`);
    setTitle("");
    setCurrent("0");
  }

  function bump(goal: EmployeeGoal, delta: number) {
    const next = updateGoalProgress(loadGoals(), goal.id, goal.current + delta);
    saveGoals(next);
    setGoals(next);
  }

  return (
    <div className="training-studio">
      <div className="split">
        <section className="panel">
          <h2>Assign a goal</h2>
          <p className="panel-lead">Goals are separate from daily tasks. Atlas tracks progress.</p>
          <form className="form-grid" onSubmit={onCreate}>
            <label>
              Employee
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.department || m.role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Goal
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="August Sales Goal" required />
            </label>
            <div className="field-row">
              <label>
                Type
                <select value={kind} onChange={(e) => setKind(e.target.value as GoalKind)}>
                  <option value="amount">Amount ($)</option>
                  <option value="count">Count</option>
                </select>
              </label>
              <label>
                {kind === "count" ? "Unit" : "Period"}
                {kind === "count" ? (
                  <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="calls" />
                ) : (
                  <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="August" />
                )}
              </label>
            </div>
            <div className="field-row">
              <label>
                Target
                <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
              </label>
              <label>
                Current
                <input type="number" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </label>
            </div>
            <button className="btn btn-dark" type="submit" disabled={members.length === 0}>
              Assign goal
            </button>
          </form>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>

        <section className="panel">
          <h2>Tracked goals</h2>
          {goals.length === 0 ? (
            <p className="muted-line">No goals yet.</p>
          ) : (
            <div className="list">
              {goals.map((g) => {
                const owner = g.memberId ? members.find((m) => m.id === g.memberId) : null;
                return (
                  <div className="list-row" key={g.id}>
                    <span className="badge">{goalPct(g)}%</span>
                    <div style={{ flex: 1 }}>
                      <p>
                        <strong>{g.title}</strong>
                        <span className="muted-line">
                          {owner ? owner.name : `${g.department} (team)`} · {formatGoalValue(g)}
                        </span>
                      </p>
                      <span className="bar-track" style={{ display: "block", marginTop: "0.35rem" }}>
                        <span className="bar-fill" style={{ width: `${goalPct(g)}%` }} />
                      </span>
                    </div>
                    <button className="btn btn-outline" type="button" onClick={() => bump(g, Math.max(1, Math.round(g.target * 0.05)))}>
                      +{Math.max(1, Math.round(g.target * 0.05)).toLocaleString()}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
