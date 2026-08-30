"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeManagerAlerts,
  departmentsOf,
  derivedStatus,
  formatGoalValue,
  getPresence,
  goalPct,
  isOpenTask,
  loadGoals,
  loadTeamMembers,
  loadTeamTasks,
  seedDemoTeamIfEmpty,
  STATUS_META,
  todayISO,
  type EmployeeGoal,
  type EmployeePresence,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

export function TeamsStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [goals, setGoals] = useState<EmployeeGoal[]>([]);
  const [presence, setPresence] = useState<Record<string, EmployeePresence>>({});
  const [now, setNow] = useState(() => Date.now());
  const [dept, setDept] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const people = loadTeamMembers();
    const map: Record<string, EmployeePresence> = {};
    for (const p of people) map[p.id] = getPresence(p.id);
    setMembers(people);
    setTasks(loadTeamTasks());
    setGoals(loadGoals());
    setPresence(map);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setReady(true);
    const interval = window.setInterval(refresh, 8000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const departments = useMemo(() => departmentsOf(members), [members]);
  const today = todayISO(new Date(now));

  const detail = useMemo(() => {
    if (!dept) return null;
    const deptMembers = members.filter((m) => (m.department || "General") === dept);
    const ids = new Set(deptMembers.map((m) => m.id));
    const deptTasks = tasks.filter((t) => ids.has(t.memberId));
    const working = deptMembers.filter((m) => derivedStatus(presence[m.id], now) !== "offline");
    const todayTasks = deptTasks.filter(
      (t) => t.kind === "task" && t.dueDate.slice(0, 10) === today && t.status !== "completed",
    );
    const meetings = deptTasks.filter(
      (t) => t.kind === "meeting" && t.dueDate.slice(0, 10) === today,
    );
    const blockers = deptTasks.filter((t) => t.status === "blocked");
    const teamGoals = goals.filter((g) => g.department === dept);
    const alerts = computeManagerAlerts(members, tasks, now).filter(
      (a) => !a.memberId || ids.has(a.memberId),
    );
    const workload = deptMembers
      .map((m) => ({ m, open: deptTasks.filter((t) => t.memberId === m.id && isOpenTask(t.status)).length }))
      .sort((a, b) => b.open - a.open);
    return { deptMembers, working, todayTasks, meetings, blockers, teamGoals, alerts, workload };
  }, [dept, members, tasks, goals, presence, now, today]);

  if (!ready) return <p className="muted-line">Loading…</p>;

  if (!dept || !detail) {
    return (
      <div className="training-studio">
        <div className="stat-grid metrics-dense">
          <div className="stat">
            <span>Departments</span>
            <strong>{departments.length}</strong>
            <small>Across the company</small>
          </div>
          <div className="stat">
            <span>Employees</span>
            <strong>{members.length}</strong>
            <small>Total</small>
          </div>
          <div className="stat">
            <span>Online now</span>
            <strong>{members.filter((m) => derivedStatus(presence[m.id], now) !== "offline").length}</strong>
            <small>Clocked in</small>
          </div>
          <div className="stat">
            <span>Open tasks</span>
            <strong>{tasks.filter((t) => isOpenTask(t.status)).length}</strong>
            <small>Company-wide</small>
          </div>
        </div>

        <section className="panel">
          <h2>Departments</h2>
          <p className="panel-lead">Click a team to see who&apos;s working, tasks, goals, blockers, and alerts.</p>
          <div className="pack-grid dense" style={{ marginTop: "1rem" }}>
            {departments.map((d) => {
              const onlineCount = members.filter(
                (m) => (m.department || "General") === d.department && derivedStatus(presence[m.id], now) !== "offline",
              ).length;
              return (
                <button className="domain-card" key={d.department} type="button" onClick={() => setDept(d.department)}>
                  <strong>{d.department}</strong>
                  <span>{d.count} employee{d.count === 1 ? "" : "s"}</span>
                  <span>{onlineCount} online now</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="training-studio">
      <div className="train-head">
        <div>
          <h2>{dept}</h2>
          <p className="panel-lead">
            {detail.deptMembers.length} employees · {detail.working.length} online
          </p>
        </div>
        <button className="btn btn-outline" type="button" onClick={() => setDept(null)}>
          All teams
        </button>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Who&apos;s working</h2>
          <div className="list">
            {detail.deptMembers.map((m) => {
              const s = derivedStatus(presence[m.id], now);
              const meta = STATUS_META[s];
              return (
                <div className="list-row" key={m.id}>
                  <span className={`presence-badge ${s}`}>
                    <span className={`presence-dot ${s}`} aria-hidden />
                    {meta.label}
                  </span>
                  <p>
                    <strong>{m.name}</strong>
                    <span className="muted-line">{m.role}</span>
                  </p>
                </div>
              );
            })}
          </div>

          <h3 style={{ marginTop: "1rem" }}>Workload</h3>
          <div className="bars" style={{ marginTop: "0.4rem" }}>
            {detail.workload.map(({ m, open }) => {
              const max = Math.max(1, ...detail.workload.map((w) => w.open));
              return (
                <div className="bar-row" key={m.id}>
                  <span>{m.name.split(" ")[0]}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${Math.round((open / max) * 100)}%` }} />
                  </span>
                  <strong>{open}</strong>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <h2>Alerts</h2>
          {detail.alerts.length === 0 ? (
            <p className="muted-line">Nothing needs attention.</p>
          ) : (
            <div className="list">
              {detail.alerts.map((a) => (
                <div className="list-row" key={a.id}>
                  <span className={a.severity === "high" ? "badge warn" : "badge"}>{a.title}</span>
                  <p>{a.detail}</p>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: "1rem" }}>Team goals</h3>
          {detail.teamGoals.length === 0 ? (
            <p className="muted-line">No goals for this team.</p>
          ) : (
            <div className="bars" style={{ marginTop: "0.4rem" }}>
              {detail.teamGoals.map((g) => (
                <div className="bar-row" key={g.id}>
                  <span title={g.title}>{g.title}</span>
                  <span className="bar-track">
                    <span className="bar-fill" style={{ width: `${goalPct(g)}%` }} />
                  </span>
                  <strong>{goalPct(g)}%</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Today&apos;s tasks</h2>
          <div className="list">
            {detail.todayTasks.length ? (
              detail.todayTasks.map((t) => {
                const who = members.find((m) => m.id === t.memberId);
                return (
                  <div className="list-row" key={t.id}>
                    <span className={t.priority === "Urgent" || t.priority === "High" ? "badge warn" : "badge"}>
                      {t.priority}
                    </span>
                    <p>
                      <strong>{t.title}</strong>
                      <span className="muted-line">{who?.name}</span>
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="muted-line">No tasks due today.</p>
            )}
          </div>

          <h3 style={{ marginTop: "1rem" }}>Blockers</h3>
          <div className="list">
            {detail.blockers.length ? (
              detail.blockers.map((t) => {
                const who = members.find((m) => m.id === t.memberId);
                return (
                  <div className="list-row" key={t.id}>
                    <span className="badge warn">Blocked</span>
                    <p>
                      <strong>{t.title}</strong>
                      <span className="muted-line">{who?.name}</span>
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="muted-line">No blockers.</p>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Meetings today</h2>
          <div className="list">
            {detail.meetings.length ? (
              detail.meetings.map((t) => {
                const who = members.find((m) => m.id === t.memberId);
                return (
                  <div className="list-row" key={t.id}>
                    <span className="badge">{t.dueTime || "Today"}</span>
                    <p>
                      <strong>{t.title}</strong>
                      <span className="muted-line">{who?.name}</span>
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="muted-line">No meetings scheduled.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
