"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createTeamTask,
  employeeAccessCode,
  getPresence,
  loadTeamMembers,
  loadTeamTasks,
  presenceState,
  relativeTime,
  saveTeamTasks,
  seedDemoTeamIfEmpty,
  type EmployeePresence,
  type PresenceState,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

function stateLabel(state: PresenceState) {
  if (state === "working") return "Working";
  if (state === "break") return "On break";
  return "Offline";
}

export function WorkforceStatusStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [presence, setPresence] = useState<Record<string, EmployeePresence>>({});
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false);
  const [assignId, setAssignId] = useState<string>("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [note, setNote] = useState<string | null>(null);

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
    setAssignId((prev) => prev || loadTeamMembers()[0]?.id || "");
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
      const state = presenceState(presence[person.id], now);
      if (state !== "offline") online += 1;
      if (state === "working") working += 1;
    }
    const openTasks = tasks.filter((t) => t.status !== "done").length;
    return { online, working, openTasks };
  }, [members, presence, tasks, now]);

  function onAssign(e: FormEvent) {
    e.preventDefault();
    const memberId = assignId || members[0]?.id;
    if (!memberId) return;
    const task = createTeamTask({ memberId, title: taskTitle, notes: taskNotes });
    saveTeamTasks([task, ...loadTeamTasks()]);
    setTaskTitle("");
    setTaskNotes("");
    const who = members.find((m) => m.id === memberId);
    setNote(`Assigned to ${who?.name ?? "employee"} — it now shows on their page.`);
    refresh();
  }

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

      <div className="split">
        <section className="panel">
          <div className="train-head">
            <div>
              <h2>Live status</h2>
              <p className="panel-lead">Updates automatically as employees clock in and work.</p>
            </div>
            <Link className="btn btn-outline" href="/employee/login">
              Employee portal
            </Link>
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
                const state = presenceState(p, now);
                const current = p?.currentTaskId
                  ? tasks.find((t) => t.id === p.currentTaskId)
                  : null;
                const open = tasks.filter(
                  (t) => t.memberId === person.id && t.status !== "done",
                ).length;
                return (
                  <div className="workforce-row" key={person.id}>
                    <div className="wf-who">
                      <strong>
                        {person.name} · <span className="muted-line">{person.role}</span>
                      </strong>
                      <span className="muted-line">
                        {state === "offline"
                          ? p?.online === false && p?.lastSeen
                            ? `Last seen ${relativeTime(p.lastSeen, now)}`
                            : "Not clocked in yet"
                          : current
                            ? `On: ${current.title}`
                            : state === "working"
                              ? "Working"
                              : "Clocked in, on a break"}
                      </span>
                      <span className="muted-line">{open} open task{open === 1 ? "" : "s"}</span>
                    </div>
                    <div className="wf-meta">
                      <span className={`presence-badge ${state}`}>
                        <span className={`presence-dot ${state}`} aria-hidden />
                        {stateLabel(state)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>Assign a task</h2>
          <p className="panel-lead">Assign work to an employee — it appears on their own page.</p>
          <form className="form-grid" onSubmit={onAssign}>
            <label>
              Employee
              <select value={assignId} onChange={(e) => setAssignId(e.target.value)}>
                {members.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} · {person.role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Task
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Call Elena Brooks before noon"
                required
              />
            </label>
            <label>
              Notes
              <input
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Optional details"
              />
            </label>
            <button className="btn btn-dark" type="submit" disabled={members.length === 0}>
              Assign task
            </button>
          </form>
          {note ? (
            <p className="muted-line" style={{ marginTop: "0.85rem" }}>
              {note}
            </p>
          ) : null}
        </section>
      </div>

      <section className="panel">
        <h2>Employee sign-in details</h2>
        <p className="panel-lead">
          Share each person&apos;s email and access code so they can sign in at{" "}
          <Link href="/employee/login">/employee/login</Link> and see their tasks.
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
  );
}
