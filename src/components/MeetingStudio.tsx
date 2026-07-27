"use client";

import { useMemo, useState } from "react";
import { meetingLibrary } from "@/lib/atlas-platform";

type Mode = "summary" | "notes" | "decisions" | "tasks" | "deadlines";

const modes: { id: Mode; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "notes", label: "Notes" },
  { id: "decisions", label: "Decisions" },
  { id: "tasks", label: "Tasks" },
  { id: "deadlines", label: "Deadlines" },
];

export function MeetingStudio() {
  const [meetingId, setMeetingId] = useState<string>(meetingLibrary[0].id);
  const [mode, setMode] = useState<Mode>("summary");
  const [recording, setRecording] = useState(false);
  const [doneTasks, setDoneTasks] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);

  const meeting = useMemo(
    () => meetingLibrary.find((item) => item.id === meetingId) ?? meetingLibrary[0],
    [meetingId],
  );

  function toggleRecord() {
    if (recording) {
      setRecording(false);
      setNote("Recording stopped. Atlas refreshed notes, decisions, tasks, deadlines, and summary.");
      setMode("summary");
      return;
    }
    setRecording(true);
    setNote("Recording… Atlas is capturing the conversation live.");
  }

  return (
    <div className="training-studio">
      <div className="hub-employee-row" role="group" aria-label="Choose meeting">
        {meetingLibrary.map((item) => (
          <button
            key={item.id}
            type="button"
            className={meetingId === item.id ? "hub-employee active" : "hub-employee"}
            onClick={() => {
              setMeetingId(item.id);
              setMode("summary");
              setNote(null);
            }}
          >
            <strong>{item.title}</strong>
            <span>{item.recorded}</span>
          </button>
        ))}
      </div>

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Notes</span>
          <strong>{meeting.notes.length}</strong>
          <small>Captured</small>
        </div>
        <div className="stat">
          <span>Decisions</span>
          <strong>{meeting.decisions.length}</strong>
          <small>Agreed</small>
        </div>
        <div className="stat">
          <span>Tasks</span>
          <strong>{meeting.tasks.length}</strong>
          <small>Assigned</small>
        </div>
        <div className="stat">
          <span>Deadlines</span>
          <strong>{meeting.deadlines.length}</strong>
          <small>Tracked</small>
        </div>
      </div>

      <div className="train-actions" style={{ marginTop: 0 }}>
        <button
          className={`btn ${recording ? "btn-outline" : "btn-dark"}`}
          type="button"
          onClick={toggleRecord}
        >
          {recording ? "Stop recording" : "Start recording"}
        </button>
        {recording ? <span className="badge warn">Live</span> : null}
      </div>
      {note ? <p className="muted-line">{note}</p> : null}

      <div className="training-tabs" role="tablist" aria-label="Meeting assistant outputs">
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
          <p className="panel-lead" style={{ marginTop: "1rem", marginBottom: 0 }}>
            Recorded {meeting.recorded}. Notes, decisions, tasks, and deadlines were generated
            automatically.
          </p>
        </section>
      ) : null}

      {mode === "notes" ? (
        <section className="panel">
          <h2>Notes</h2>
          <div className="list">
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
          <div className="list">
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
          <div className="list">
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
                      {doneTasks[key] ? " · done" : ""}
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
          <div className="list">
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
  );
}
