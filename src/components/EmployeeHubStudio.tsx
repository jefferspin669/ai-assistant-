"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { hubAssistantReply } from "@/lib/atlas-platform";
import {
  createTeamMember,
  createTeamTask,
  isOpenTask,
  loadTeamMembers,
  loadTeamTasks,
  saveTeamMembers,
  saveTeamTasks,
  TASK_STATUSES,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

type Mode = "overview" | "tasks" | "assistant";
type ChatMsg = { role: "ai" | "user"; text: string };

const modes: { id: Mode; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks", label: "Host tasks" },
  { id: "assistant", label: "AI assistant" },
];

export type EmployeeHubHandle = {
  openInvite: () => void;
};

export function EmployeeHubStudio({
  onReadyInvite,
}: {
  onReadyInvite?: (open: () => void) => void;
} = {}) {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("overview");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("Tech");
  const [inviteEmail, setInviteEmail] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantChat, setAssistantChat] = useState<Record<string, ChatMsg[]>>({});
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadedMembers = loadTeamMembers();
    const loadedTasks = loadTeamTasks();
    setMembers(loadedMembers);
    setTasks(loadedTasks);
    setEmployeeId(loadedMembers[0]?.id ?? null);
    setShowInvite(loadedMembers.length === 0);
    setReady(true);
  }, []);

  useEffect(() => {
    onReadyInvite?.(() => setShowInvite(true));
  }, [onReadyInvite]);

  const employee = useMemo(
    () => members.find((person) => person.id === employeeId) ?? null,
    [members, employeeId],
  );

  const memberTasks = tasks.filter((task) => task.memberId === employeeId);

  const chat = employee
    ? assistantChat[employee.id] ?? [
        {
          role: "ai" as const,
          text: `Hi ${employee.name.split(" ")[0]} — I’m your hub assistant. Ask about schedule, manuals, refunds, or tasks.`,
        },
      ]
    : [];

  function persistMembers(next: TeamPerson[]) {
    setMembers(next);
    saveTeamMembers(next);
  }

  function persistTasks(next: TeamTask[]) {
    setTasks(next);
    saveTeamTasks(next);
  }

  function onInvite(e: FormEvent) {
    e.preventDefault();
    const member = createTeamMember({
      name: inviteName,
      role: inviteRole,
      email: inviteEmail,
    });
    const next = [member, ...members];
    persistMembers(next);
    setEmployeeId(member.id);
    setShowInvite(false);
    setInviteName("");
    setInviteEmail("");
    setNote(`Invited ${member.name}. Open their page to manage tasks.`);
  }

  function onAssignTask(e: FormEvent) {
    e.preventDefault();
    if (!employee) return;
    const task = createTeamTask({
      memberId: employee.id,
      title: taskTitle,
      notes: taskNotes,
    });
    persistTasks([task, ...tasks]);
    setTaskTitle("");
    setTaskNotes("");
    setNote(`Task assigned to ${employee.name}.`);
    setMode("tasks");
  }

  function setTaskStatus(id: string, status: TeamTask["status"]) {
    persistTasks(tasks.map((task) => (task.id === id ? { ...task, status } : task)));
  }

  function removeMember(id: string) {
    const next = members.filter((person) => person.id !== id);
    persistMembers(next);
    persistTasks(tasks.filter((task) => task.memberId !== id));
    setEmployeeId(next[0]?.id ?? null);
    if (next.length === 0) setShowInvite(true);
    setNote("Team member removed.");
  }

  function askAssistant(e: FormEvent) {
    e.preventDefault();
    if (!employee) return;
    const trimmed = assistantInput.trim();
    if (!trimmed) return;
    const reply = hubAssistantReply(employee.name.split(" ")[0], trimmed);
    setAssistantChat((prev) => ({
      ...prev,
      [employee.id]: [
        ...(prev[employee.id] ?? chat),
        { role: "user", text: trimmed },
        { role: "ai", text: reply },
      ],
    }));
    setAssistantInput("");
  }

  return (
    <div className="training-studio">
      {showInvite ? (
        <section className="panel">
          <h2>Invite team member</h2>
          <p className="panel-lead">
            Add people with their own page. As host, you can assign tasks to each member.
          </p>
          <form className="form-grid" onSubmit={onInvite}>
            <label>
              Name
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Alex Rivera"
                required
              />
            </label>
            <label>
              Role
              <input
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                placeholder="Lead tech"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="alex@business.com"
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Invite employee
            </button>
            {members.length > 0 ? (
              <button className="btn btn-outline" type="button" onClick={() => setShowInvite(false)}>
                Cancel
              </button>
            ) : null}
          </form>
        </section>
      ) : null}

      <div className="hub-employee-row" role="group" aria-label="Choose employee">
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {ready && members.length === 0 ? (
          <p className="muted-line">No team members yet — invite your first person above.</p>
        ) : (
          members.map((person) => (
            <button
              key={person.id}
              type="button"
              className={employeeId === person.id ? "hub-employee active" : "hub-employee"}
              onClick={() => {
                setEmployeeId(person.id);
                setMode("overview");
              }}
            >
              <strong>{person.name}</strong>
              <span>
                {person.role} · {person.status}
              </span>
            </button>
          ))
        )}
        <button className="hub-employee" type="button" onClick={() => setShowInvite(true)}>
          <strong>+ Invite</strong>
          <span>Add teammate</span>
        </button>
      </div>

      {employee ? (
        <>
          <div className="training-tabs" role="tablist" aria-label="Employee hub modules">
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

          {mode === "overview" ? (
            <div className="split">
              <section className="panel">
                <h2>{employee.name}</h2>
                <p className="panel-lead">
                  {employee.role} · {employee.email}
                </p>
                <div className="stat-grid metrics-dense">
                  <div className="stat">
                    <span>Status</span>
                    <strong>{employee.status}</strong>
                    <small>Availability</small>
                  </div>
                  <div className="stat">
                    <span>Open tasks</span>
                    <strong>{memberTasks.filter((t) => isOpenTask(t.status)).length}</strong>
                    <small>Assigned by host</small>
                  </div>
                  <div className="stat">
                    <span>Jobs</span>
                    <strong>{employee.jobsThisWeek}</strong>
                    <small>This week</small>
                  </div>
                  <div className="stat">
                    <span>Rating</span>
                    <strong>{employee.rating}</strong>
                    <small>Customer CSAT</small>
                  </div>
                </div>
                <div className="train-actions">
                  <Link className="btn btn-dark" href={`/app/team/${employee.id}`}>
                    Open member page
                  </Link>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => removeMember(employee.id)}
                  >
                    Remove
                  </button>
                </div>
              </section>
              <section className="panel">
                <h2>Quick assign</h2>
                <form className="form-grid" onSubmit={onAssignTask}>
                  <label>
                    Task
                    <input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Follow up with Elena Brooks"
                      required
                    />
                  </label>
                  <label>
                    Notes
                    <input
                      value={taskNotes}
                      onChange={(e) => setTaskNotes(e.target.value)}
                      placeholder="Call before noon"
                    />
                  </label>
                  <button className="btn btn-dark" type="submit">
                    Assign task
                  </button>
                </form>
              </section>
            </div>
          ) : null}

          {mode === "tasks" ? (
            <section className="panel">
              <h2>Tasks for {employee.name}</h2>
              <form className="form-grid" onSubmit={onAssignTask}>
                <label>
                  Task
                  <input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Stock filters on truck"
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
                <button className="btn btn-dark" type="submit">
                  Assign task
                </button>
              </form>
              {memberTasks.length === 0 ? (
                <p className="muted-line" style={{ marginTop: "1rem" }}>
                  No tasks assigned yet.
                </p>
              ) : (
                <div className="list" style={{ marginTop: "1rem" }}>
                  {memberTasks.map((task) => (
                    <div className="list-row" key={task.id}>
                      <select
                        value={task.status}
                        onChange={(e) =>
                          setTaskStatus(task.id, e.target.value as TeamTask["status"])
                        }
                        aria-label={`Status for ${task.title}`}
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                      <div>
                        <p>
                          <strong>{task.title}</strong>
                        </p>
                        {task.notes.length ? (
                          <small className="muted-line">{task.notes[task.notes.length - 1].text}</small>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {mode === "assistant" ? (
            <section className="panel command-panel">
              <h2>AI assistant · {employee.name.split(" ")[0]}</h2>
              <div className="command-thread">
                {chat.map((m, i) => (
                  <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
                    {m.text}
                  </div>
                ))}
              </div>
              <form className="command-form" onSubmit={askAssistant}>
                <input
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  placeholder="Ask about today’s work…"
                />
                <button className="btn btn-dark" type="submit">
                  Send
                </button>
              </form>
            </section>
          ) : null}
        </>
      ) : null}

      {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
    </div>
  );
}
