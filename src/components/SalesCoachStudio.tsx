"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  assignCoachingGoal,
  coachingInsightsForEmployee,
  loadCoachingGoals,
  teamCoachingSummary,
  type CoachingGoal,
} from "@/lib/sales-coach-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty } from "@/lib/user-workspace";

export function SalesCoachStudio() {
  const [employeeId, setEmployeeId] = useState("");
  const [goals, setGoals] = useState<CoachingGoal[]>([]);
  const [goalText, setGoalText] = useState("Improve follow-up speed");
  const [target, setTarget] = useState("Under 8 hours");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const members = loadTeamMembers();
    setEmployeeId(members[0]?.id ?? "");
    setGoals(loadCoachingGoals());
  }, []);

  const insights = employeeId ? coachingInsightsForEmployee(employeeId) : [];
  const team = teamCoachingSummary();
  const member = loadTeamMembers().find((m) => m.id === employeeId);

  function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!member) return;
    assignCoachingGoal(employeeId, member.name, goalText, target, "Manager");
    setGoals(loadCoachingGoals());
    setNote(`Coaching goal assigned to ${member.name}.`);
  }

  return (
    <div className="training-studio">
      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      <section className="panel">
        <h2>Team signals</h2>
        <div className="list">
          {team.map((ins) => (
            <div key={ins.id} className="list-row">
              <span className="badge warn">{ins.employeeName}</span>
              <p><strong>{ins.message}</strong><span className="muted-line">{ins.detail}</span></p>
            </div>
          ))}
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Employee coaching</h2>
          <label>
            Employee
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {loadTeamMembers().map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <div className="list" style={{ marginTop: "1rem" }}>
            {insights.map((ins) => (
              <div key={ins.id} className="list-row">
                <span className={ins.severity === "warn" ? "badge warn" : "badge ok"}>{ins.kind}</span>
                <p><strong>{ins.message}</strong><span className="muted-line">{ins.detail}</span></p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Manager goals</h2>
          <form className="form-grid" onSubmit={onAssign}>
            <label>Goal<input value={goalText} onChange={(e) => setGoalText(e.target.value)} /></label>
            <label>Target<input value={target} onChange={(e) => setTarget(e.target.value)} /></label>
            <button className="btn btn-dark" type="submit">Assign goal</button>
          </form>
          <div className="list" style={{ marginTop: "1rem" }}>
            {goals.map((g) => (
              <div key={g.id} className="list-row">
                <span className="badge">{g.employeeName}</span>
                <p>{g.goal} — target {g.target} ({g.progress})</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
