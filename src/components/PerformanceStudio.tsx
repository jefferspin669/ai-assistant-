"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadTeamMembers,
  loadTeamTasks,
  performanceSummary,
  seedDemoTeamIfEmpty,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

export function PerformanceStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [id, setId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const people = loadTeamMembers();
    setMembers(people);
    setTasks(loadTeamTasks());
    setId((prev) => prev || people[0]?.id || "");
    setReady(true);
  }, []);

  const member = members.find((m) => m.id === id) ?? null;
  const perf = useMemo(
    () => (member ? performanceSummary(member, tasks) : null),
    [member, tasks],
  );

  return (
    <div className="training-studio">
      <div className="training-tabs" role="tablist" aria-label="Choose employee">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={id === m.id}
            className={id === m.id ? "training-tab active" : "training-tab"}
            onClick={() => setId(m.id)}
          >
            {m.name}
          </button>
        ))}
      </div>

      {!ready ? <p className="muted-line">Loading…</p> : null}

      {member && perf ? (
        <>
          <div className="stat-grid metrics-dense">
            <div className="stat">
              <span>Tasks completed</span>
              <strong>{perf.tasksCompleted}</strong>
              <small>All-time</small>
            </div>
            <div className="stat">
              <span>On-time completion</span>
              <strong>{perf.onTimePct}%</strong>
              <small>Met the due date</small>
            </div>
            <div className="stat">
              <span>Avg completion</span>
              <strong style={{ fontSize: "1rem" }}>{perf.avgCompletion}</strong>
              <small>Per task</small>
            </div>
            <div className="stat">
              <span>Customer satisfaction</span>
              <strong>{perf.csat}/5</strong>
              <small>From reviews</small>
            </div>
          </div>

          <div className="split">
            <section className="panel">
              <h2>Attendance & training</h2>
              <div className="bars" style={{ marginTop: "0.4rem" }}>
                <div className="bar-row">
                  <span>Attendance</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${perf.attendancePct}%` }} />
                  </span>
                  <strong>{perf.attendancePct}%</strong>
                </div>
                <div className="bar-row">
                  <span>Training</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${perf.trainingProgress}%` }} />
                  </span>
                  <strong>{perf.trainingProgress}%</strong>
                </div>
              </div>
              <div className="memory-card" style={{ marginTop: "1rem" }}>
                <div className="label">Current workload</div>
                <p>
                  <strong>{perf.currentWorkload}</strong> open task
                  {perf.currentWorkload === 1 ? "" : "s"} right now · {perf.completedInApp} completed
                  in Atlas.
                </p>
              </div>
              <p className="muted-line" style={{ marginTop: "0.8rem" }}>
                These are work metrics shown with context. Atlas deliberately avoids reducing anyone
                to a single &quot;productivity score.&quot;
              </p>
            </section>

            <section className="panel">
              <h2>Goals</h2>
              <div className="list">
                {perf.goals.length ? (
                  perf.goals.map((g) => (
                    <div className="list-row" key={g}>
                      <span className="badge">Goal</span>
                      <p>{g}</p>
                    </div>
                  ))
                ) : (
                  <p className="muted-line">No goals set.</p>
                )}
              </div>

              <h3 style={{ marginTop: "1rem" }}>Achievements</h3>
              <div className="list">
                {perf.achievements.length ? (
                  perf.achievements.map((a) => (
                    <div className="list-row" key={a}>
                      <span className="badge ok">🏆</span>
                      <p>{a}</p>
                    </div>
                  ))
                ) : (
                  <p className="muted-line">No achievements yet.</p>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
