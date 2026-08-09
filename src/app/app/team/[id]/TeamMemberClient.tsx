"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useLanguage } from "@/components/LanguageProvider";
import {
  createTeamTask,
  loadTeamMembers,
  loadTeamTasks,
  saveTeamTasks,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

export function TeamMemberClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { t, tTitle } = useLanguage();
  const [member, setMember] = useState<TeamPerson | null>(null);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const people = loadTeamMembers();
    const allTasks = loadTeamTasks();
    setMember(people.find((person) => person.id === id) ?? null);
    setTasks(allTasks.filter((task) => task.memberId === id));
    setReady(true);
  }, [id]);

  const openCount = useMemo(
    () => tasks.filter((task) => task.status !== "done").length,
    [tasks],
  );

  function persist(next: TeamTask[]) {
    setTasks(next);
    const others = loadTeamTasks().filter((task) => task.memberId !== id);
    saveTeamTasks([...next, ...others]);
  }

  function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!member) return;
    const task = createTeamTask({ memberId: member.id, title, notes });
    persist([task, ...tasks]);
    setTitle("");
    setNotes("");
  }

  function setStatus(taskId: string, status: TeamTask["status"]) {
    persist(tasks.map((task) => (task.id === taskId ? { ...task, status } : task)));
  }

  function removeTask(taskId: string) {
    persist(tasks.filter((task) => task.id !== taskId));
  }

  return (
    <AppShell
      title="Team member"
      subtitle={member ? `${member.name} · ${member.role}` : "Member page"}
      action={
        <Link className="btn btn-outline" href="/app/team">
          Back to hub
        </Link>
      }
    >
      {!ready ? <p className="muted-line">Loading…</p> : null}
      {ready && !member ? (
        <section className="panel">
          <h2>Member not found</h2>
          <p className="panel-lead">This teammate may have been removed.</p>
          <Link className="btn btn-dark" href="/app/team">
            Return to Employee Hub
          </Link>
        </section>
      ) : null}

      {member ? (
        <div className="split">
          <section className="panel">
            <h2>{member.name}</h2>
            <p className="panel-lead">
              {member.role} · {member.email} · {member.status}
            </p>
            <div className="stat-grid metrics-dense">
              <div className="stat">
                <span>Open tasks</span>
                <strong>{openCount}</strong>
                <small>Assigned by host</small>
              </div>
              <div className="stat">
                <span>Total tasks</span>
                <strong>{tasks.length}</strong>
                <small>On this page</small>
              </div>
              <div className="stat">
                <span>Jobs</span>
                <strong>{member.jobsThisWeek}</strong>
                <small>This week</small>
              </div>
              <div className="stat">
                <span>Rating</span>
                <strong>{member.rating}</strong>
                <small>CSAT</small>
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Assign task (host)</h2>
            <form className="form-grid" onSubmit={onAssign}>
              <label>
                Task
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Call customer before noon"
                  required
                />
              </label>
              <label>
                Notes
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details"
                />
              </label>
              <button className="btn btn-dark" type="submit">
                {t("common.add")} task
              </button>
            </form>
          </section>
        </div>
      ) : null}

      {member ? (
        <section className="panel">
          <h2>{tTitle("Team member")} tasks</h2>
          {tasks.length === 0 ? (
            <p className="muted-line">{t("common.empty")}</p>
          ) : (
            <div className="list">
              {tasks.map((task) => (
                <div className="list-row" key={task.id}>
                  <select
                    value={task.status}
                    onChange={(e) => setStatus(task.id, e.target.value as TeamTask["status"])}
                  >
                    <option value="todo">Todo</option>
                    <option value="doing">Doing</option>
                    <option value="done">Done</option>
                  </select>
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{task.title}</strong>
                    </p>
                    {task.notes ? <small className="muted-line">{task.notes}</small> : null}
                  </div>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => removeTask(task.id)}
                  >
                    {t("common.remove")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}
