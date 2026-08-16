"use client";

import Link from "@/components/SiteLink";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeManagerAlerts,
  derivedStatus,
  employeeAccessCode,
  EMPLOYEE_STATUSES,
  getPresence,
  isOpenTask,
  loadTeamMembers,
  loadTeamTasks,
  relativeTime,
  seedDemoTeamIfEmpty,
  STATUS_META,
  type EmployeePresence,
  type EmployeeStatus,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

export function WorkforceStatusStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [presence, setPresence] = useState<Record<string, EmployeePresence>>({});
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    const people = loadTeamMembers();
    const allTasks = loadTeamTasks();
    const map: Record<string, EmployeePresence> = {};
    for (const person of people) map[person.id] = getPresence(person.id);
    setMembers(people);
    setTasks(allTasks);
    setPresence(map);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setReady(true);

    const interval = window.setInterval(refresh, 5000);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("atlas-employee-") || e.key.startsWith("atlas-user-team")) {
        refresh();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const stats = useMemo(() => {
    let online = 0;
    let working = 0;
    for (const person of members) {
      const s = derivedStatus(presence[person.id], now);
      if (s !== "offline") online += 1;
      if (s === "working") working += 1;
    }
    const openTasks = tasks.filter((t) => isOpenTask(t.status)).length;
    return { online, working, openTasks };
  }, [members, presence, tasks, now]);

  const alerts = useMemo(
    () => computeManagerAlerts(members, tasks, now),
    [members, tasks, now],
  );

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Employees</span>
          <strong>{members.length}</strong>
          <small>On the team</small>
        </div>
        <div className="stat">
          <span>Online now</span>
          <strong>{stats.online}</strong>
          <small>Clocked in</small>
        </div>
        <div className="stat">
          <span>Working</span>
          <strong>{stats.working}</strong>
          <small>Actively on tasks</small>
        </div>
        <div className="stat">
          <span>Open tasks</span>
          <strong>{stats.openTasks}</strong>
          <small>Across the team</small>
        </div>
      </div>

      <section className="panel">
        <div className="train-head">
          <div>
            <h2>Alerts</h2>
            <p className="panel-lead">Atlas surfaces what needs your attention — not everything.</p>
          </div>
          <span className={alerts.length ? "badge warn" : "badge ok"}>
            {alerts.length ? `${alerts.length} active` : "All clear"}
          </span>
        </div>
        {alerts.length === 0 ? (
          <p className="muted-line">Nothing needs attention right now.</p>
        ) : (
          <div className="list">
            {alerts.map((a) => (
              <div className="list-row" key={a.id}>
                <span className={a.severity === "high" ? "badge warn" : "badge"}>{a.title}</span>
                <p>{a.detail}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="split">
        <section className="panel">
          <div className="train-head">
            <div>
              <h2>Live status</h2>
              <p className="panel-lead">Updates automatically as employees clock in and work.</p>
            </div>
            <div className="train-actions">
              <Link className="btn btn-dark" href="/app/assign-tasks">
                Create task
              </Link>
              <Link className="btn btn-outline" href="/employee/login">
                Employee portal
              </Link>
            </div>
          </div>

          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && members.length === 0 ? (
            <p className="muted-line">
              No employees yet. Add them in the <Link href="/app/team">Employee Hub</Link>.
            </p>
          ) : (
            <div>
              {members.map((person) => {
                const p = presence[person.id];
                const s: EmployeeStatus = derivedStatus(p, now);
                const meta = STATUS_META[s];
                const current = p?.currentTaskId
                  ? tasks.find((t) => t.id === p.currentTaskId)
                  : null;
                const open = tasks.filter(
                  (t) => t.memberId === person.id && isOpenTask(t.status),
                ).length;
                return (
                  <div className="workforce-row" key={person.id}>
                    <div className="wf-who">
                      <strong>
                        {person.name} · <span className="muted-line">{person.role}</span>
                      </strong>
                      <span className="muted-line">
                        {s === "offline"
                          ? p?.lastSeen && p?.clockedIn === false && p.manualStatus
                            ? `Last seen ${relativeTime(p.lastSeen, now)}`
                            : "Not clocked in"
                          : current
                            ? `On: ${current.title}`
                            : meta.label}
                      </span>
                      <span className="muted-line">
                        {open} open task{open === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="wf-meta">
                      <span className={`presence-badge ${s}`}>
                        <span className={`presence-dot ${s}`} aria-hidden />
                        {meta.emoji} {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <h3 style={{ marginTop: "1.1rem" }}>Status legend</h3>
          <div className="status-legend">
            {[...EMPLOYEE_STATUSES, { id: "offline" as const, label: "Offline", emoji: "🔴" }].map(
              (s) => (
                <span className="presence-badge" key={s.id}>
                  <span className={`presence-dot ${s.id}`} aria-hidden />
                  {s.emoji} {s.label}
                </span>
              ),
            )}
          </div>
          <p className="muted-line" style={{ marginTop: "0.6rem" }}>
            Employees set Working, On break, In meeting, On customer job, and Waiting/blocked. Atlas
            auto-detects <strong>Away</strong> (idle) and <strong>Offline</strong> (app closed) from
            basic activity — no screen or keystroke monitoring.
          </p>
        </section>

        <section className="panel">
          <h2>Employee sign-in details</h2>
          <p className="panel-lead">
            Share each person&apos;s email and access code so they can sign in at{" "}
            <Link href="/employee/login">/employee/login</Link>.
          </p>
          <div className="list">
            {members.map((person) => (
              <div className="list-row" key={person.id}>
                <span className="badge">{employeeAccessCode(person)}</span>
                <p>
                  <strong>{person.name}</strong>
                  <span className="muted-line">{person.email}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
