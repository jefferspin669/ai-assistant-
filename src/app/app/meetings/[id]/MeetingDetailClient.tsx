"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  addMeetingToCalendar,
  endMeetingCapture,
  loadMeetings,
  saveMeetings,
  startMeetingCapture,
  type UserMeeting,
} from "@/lib/surface-workspace";
import { createTeamTasksFromMeeting } from "@/lib/user-workspace";

type Mode = "summary" | "notes" | "decisions" | "tasks" | "deadlines";

const modes: { id: Mode; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "notes", label: "Notes" },
  { id: "decisions", label: "Decisions" },
  { id: "tasks", label: "Tasks" },
  { id: "deadlines", label: "Deadlines" },
];

export function MeetingDetailClient() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [meeting, setMeeting] = useState<UserMeeting | null>(null);
  const [mode, setMode] = useState<Mode>("summary");
  const [noteDraft, setNoteDraft] = useState("");
  const [decisionDraft, setDecisionDraft] = useState("");
  const [taskDraft, setTaskDraft] = useState("");
  const [taskOwner, setTaskOwner] = useState("");
  const [deadlineDraft, setDeadlineDraft] = useState("");
  const [deadlineDue, setDeadlineDue] = useState("Fri");
  const [doneTasks, setDoneTasks] = useState<Record<string, boolean>>({});
  const [flash, setFlash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const found = loadMeetings().find((item) => item.id === id) ?? null;
    setMeeting(found);
    setReady(true);
  }, [id]);

  function persist(updated: UserMeeting) {
    const base = loadMeetings();
    const merged = base.some((item) => item.id === updated.id)
      ? base.map((item) => (item.id === updated.id ? updated : item))
      : [updated, ...base];
    saveMeetings(merged);
    setMeeting(updated);
  }

  function start() {
    if (!meeting) return;
    const updated = startMeetingCapture(meeting);
    persist(updated);
    setFlash(`Joined ${updated.platform}. Capturing live on this meeting page.`);
  }

  function stop() {
    if (!meeting) return;
    const updated = endMeetingCapture(meeting);
    persist(updated);
    setFlash("Meeting ended. Summary and follow-ups are ready.");
  }

  function sendRecap() {
    if (!meeting) return;
    persist({ ...meeting, recapSent: true });
    setFlash(`Recap emailed to ${meeting.attendees.join(", ")}.`);
  }

  function addNote(e: FormEvent) {
    e.preventDefault();
    if (!meeting || !noteDraft.trim()) return;
    persist({ ...meeting, notes: [...meeting.notes, noteDraft.trim()] });
    setNoteDraft("");
  }

  function addDecision(e: FormEvent) {
    e.preventDefault();
    if (!meeting || !decisionDraft.trim()) return;
    persist({ ...meeting, decisions: [...meeting.decisions, decisionDraft.trim()] });
    setDecisionDraft("");
  }

  function addTask(e: FormEvent) {
    e.preventDefault();
    if (!meeting || !taskDraft.trim()) return;
    persist({
      ...meeting,
      tasks: [
        ...meeting.tasks,
        {
          owner: taskOwner.trim() || meeting.attendees[0] || "You",
          task: taskDraft.trim(),
          due: "Soon",
        },
      ],
    });
    setTaskDraft("");
    setTaskOwner("");
  }

  function addDeadline(e: FormEvent) {
    e.preventDefault();
    if (!meeting || !deadlineDraft.trim()) return;
    persist({
      ...meeting,
      deadlines: [...meeting.deadlines, { label: deadlineDraft.trim(), due: deadlineDue || "Fri" }],
    });
    setDeadlineDraft("");
  }

  function addToCalendar() {
    if (!meeting) return;
    persist(addMeetingToCalendar(meeting));
    setFlash("Meeting added to Atlas Calendar — reminders at 1 day, 1 hour, 15 minutes, and start.");
  }

  function pushTasks() {
    if (!meeting) return;
    const count = createTeamTasksFromMeeting(meeting);
    setFlash(`Atlas created ${count} task${count === 1 ? "" : "s"} in Workforce from this meeting.`);
  }

  return (
    <AppShell
      title="Meeting Intelligence"
      subtitle={meeting ? `${meeting.title} · ${meeting.platform}` : "Meeting page"}
      action={
        <Link className="btn btn-outline" href="/app/meetings">
          All meetings
        </Link>
      }
    >
      {!ready ? <p className="muted-line">Loading…</p> : null}
      {ready && !meeting ? (
        <section className="panel">
          <h2>Meeting not found</h2>
          <p className="panel-lead">This meeting may have been removed.</p>
          <Link className="btn btn-dark" href="/app/meetings">
            Back to meetings
          </Link>
        </section>
      ) : null}

      {meeting ? (
        <div className="training-studio">
          <div className="train-actions">
            {meeting.status !== "live" ? (
              <button className="btn btn-dark" type="button" onClick={start}>
                Start meeting
              </button>
            ) : (
              <button className="btn btn-outline" type="button" onClick={stop}>
                Stop recording
              </button>
            )}
            <button className="btn btn-outline" type="button" onClick={sendRecap}>
              {meeting.recapSent ? "Recap sent" : "Email meeting recap"}
            </button>
            {!meeting.calendarAdded ? (
              <button className="btn btn-dark" type="button" onClick={addToCalendar}>Add to Calendar</button>
            ) : (
              <span className="badge ok">On calendar</span>
            )}
            <a className="btn btn-outline" href={meeting.joinUrl} target="_blank" rel="noreferrer">Join meeting</a>
            {meeting.status === "ended" && meeting.tasks.length > 0 ? (
              <button className="btn btn-dark" type="button" onClick={pushTasks}>Create tasks</button>
            ) : null}
            {meeting.status === "live" ? <span className="badge warn">Live</span> : null}
          </div>
          {flash ? <p className="muted-line">{flash}</p> : null}

          <div className="training-tabs" role="tablist">
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

          {mode === "summary" ? (
            <section className="panel">
              <h2>Summary · {meeting.title}</h2>
              <div className="memory-card">
                <div className="label">Atlas summary</div>
                <p>{meeting.summary}</p>
              </div>
              <p className="panel-lead" style={{ marginTop: "1rem" }}>
                {meeting.date} {meeting.startTime}–{meeting.endTime} · {meeting.location} · {meeting.recorded}
              </p>
              <p className="panel-lead">Attendees: {meeting.attendees.join(", ")}.</p>
              {meeting.status === "ended" && meeting.decisions.length > 0 ? (
                <>
                  <h3>Decisions</h3>
                  <ul className="plain-list">
                    {meeting.decisions.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                  <h3>Action items</h3>
                  <ul className="plain-list">
                    {meeting.tasks.map((t) => (
                      <li key={`${t.owner}-${t.task}`}>{t.owner} → {t.task} ({t.due})</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </section>
          ) : null}

          {mode === "notes" ? (
            <section className="panel">
              <h2>Notes</h2>
              <form className="train-form" onSubmit={addNote}>
                <input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Add a note…"
                />
                <button className="btn btn-dark" type="submit">
                  Add
                </button>
              </form>
              <div className="list" style={{ marginTop: "1rem" }}>
                {meeting.notes.map((item) => (
                  <div className="list-row" key={item}>
                    <span className="badge">Note</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {mode === "decisions" ? (
            <section className="panel">
              <h2>Decisions</h2>
              <form className="train-form" onSubmit={addDecision}>
                <input
                  value={decisionDraft}
                  onChange={(e) => setDecisionDraft(e.target.value)}
                  placeholder="Add a decision…"
                />
                <button className="btn btn-dark" type="submit">
                  Add
                </button>
              </form>
              <div className="list" style={{ marginTop: "1rem" }}>
                {meeting.decisions.map((item) => (
                  <div className="list-row" key={item}>
                    <span className="badge ok">Decision</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {mode === "tasks" ? (
            <section className="panel">
              <h2>Tasks</h2>
              <form className="form-grid" onSubmit={addTask}>
                <label>
                  Task
                  <input value={taskDraft} onChange={(e) => setTaskDraft(e.target.value)} required />
                </label>
                <label>
                  Owner
                  <input value={taskOwner} onChange={(e) => setTaskOwner(e.target.value)} />
                </label>
                <button className="btn btn-dark" type="submit">
                  Add task
                </button>
              </form>
              <div className="list" style={{ marginTop: "1rem" }}>
                {meeting.tasks.map((task) => {
                  const key = `${meeting.id}:${task.task}`;
                  return (
                    <label className="quality-check-row" key={key}>
                      <input
                        type="checkbox"
                        checked={Boolean(doneTasks[key])}
                        onChange={(e) =>
                          setDoneTasks((prev) => ({ ...prev, [key]: e.target.checked }))
                        }
                      />
                      <span>
                        <strong>{task.task}</strong>
                        <span className="muted-line">
                          {task.owner} · due {task.due}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ) : null}

          {mode === "deadlines" ? (
            <section className="panel">
              <h2>Deadlines</h2>
              <form className="form-grid" onSubmit={addDeadline}>
                <label>
                  Deadline
                  <input
                    value={deadlineDraft}
                    onChange={(e) => setDeadlineDraft(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Due
                  <input value={deadlineDue} onChange={(e) => setDeadlineDue(e.target.value)} />
                </label>
                <button className="btn btn-dark" type="submit">
                  Add deadline
                </button>
              </form>
              <div className="list" style={{ marginTop: "1rem" }}>
                {meeting.deadlines.map((deadline) => (
                  <div className="list-row" key={deadline.label}>
                    <span className="badge warn">{deadline.due}</span>
                    <p>{deadline.label}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
