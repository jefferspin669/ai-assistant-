"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import {
  createMeeting,
  endMeetingCapture,
  loadMeetings,
  saveMeetings,
  startMeetingCapture,
  type UserMeeting,
} from "@/lib/surface-workspace";

export function MeetingStudio({
  newSignal = 0,
  focusId,
}: {
  newSignal?: number;
  focusId?: string;
}) {
  const [meetings, setMeetings] = useState<UserMeeting[]>([]);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Zoom");
  const [attendees, setAttendees] = useState("Jeff, Sam, Emma");
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadMeetings();
    setMeetings(loaded);
    const preferred = focusId && loaded.some((m) => m.id === focusId) ? focusId : loaded[0]?.id ?? null;
    setMeetingId(preferred);
    setShowForm(loaded.length === 0);
    setReady(true);
  }, [focusId]);

  useEffect(() => {
    if (newSignal <= 0) return;
    setShowForm(true);
  }, [newSignal]);

  const meeting = meetings.find((item) => item.id === meetingId) ?? null;

  function persist(next: UserMeeting[], selectId?: string | null) {
    setMeetings(next);
    saveMeetings(next);
    if (selectId !== undefined) setMeetingId(selectId);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const created = createMeeting({ title, platform, attendees });
    const next = [created, ...meetings];
    persist(next, created.id);
    setShowForm(false);
    setTitle("");
    setNote(`Meeting “${created.title}” created. Open its page to start.`);
  }

  function startMeeting() {
    if (!meeting) return;
    const updated = startMeetingCapture(meeting);
    persist(
      meetings.map((item) => (item.id === meeting.id ? updated : item)),
      updated.id,
    );
    setNote(`Joined ${updated.platform}. Recording… Atlas is capturing live.`);
  }

  function stopMeeting() {
    if (!meeting) return;
    const updated = endMeetingCapture(meeting);
    persist(
      meetings.map((item) => (item.id === meeting.id ? updated : item)),
      updated.id,
    );
    setNote("Recording stopped. Notes, decisions, tasks, and deadlines refreshed.");
  }

  function removeMeeting(id: string) {
    const next = meetings.filter((item) => item.id !== id);
    persist(next, next[0]?.id ?? null);
    if (next.length === 0) setShowForm(true);
    setNote("Meeting removed.");
  }

  return (
    <div className="training-studio">
      {showForm ? (
        <section className="panel">
          <h2>New meeting</h2>
          <p className="panel-lead">Add a meeting — each one gets its own page when you start it.</p>
          <form className="form-grid" onSubmit={onCreate}>
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly ops standup"
                required
              />
            </label>
            <label>
              Platform
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <option>Zoom</option>
                <option>Google Meet</option>
                <option>Teams</option>
                <option>Phone</option>
              </select>
            </label>
            <label>
              Attendees
              <input
                value={attendees}
                onChange={(e) => setAttendees(e.target.value)}
                placeholder="Jeff, Sam, Emma"
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Add meeting
            </button>
            {meetings.length > 0 ? (
              <button className="btn btn-outline" type="button" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            ) : null}
          </form>
        </section>
      ) : null}

      <div className="hub-employee-row" role="group" aria-label="Choose meeting">
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {ready && meetings.length === 0 ? (
          <p className="muted-line">No meetings yet. Add your first one above.</p>
        ) : (
          meetings.map((item) => (
            <button
              key={item.id}
              type="button"
              className={meetingId === item.id ? "hub-employee active" : "hub-employee"}
              onClick={() => {
                setMeetingId(item.id);
                setNote(null);
              }}
            >
              <strong>{item.title}</strong>
              <span>
                {item.status} · {item.platform}
              </span>
            </button>
          ))
        )}
        <button className="hub-employee" type="button" onClick={() => setShowForm(true)}>
          <strong>+ New</strong>
          <span>Create meeting</span>
        </button>
      </div>

      {meeting ? (
        <>
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
              <span>Status</span>
              <strong>{meeting.status}</strong>
              <small>{meeting.recorded}</small>
            </div>
          </div>

          <div className="train-actions">
            {meeting.status !== "live" ? (
              <button className="btn btn-dark" type="button" onClick={startMeeting}>
                Start meeting
              </button>
            ) : (
              <button className="btn btn-outline" type="button" onClick={stopMeeting}>
                Stop recording
              </button>
            )}
            <Link className="btn btn-outline" href={`/app/meetings/${meeting.id}`}>
              Open meeting page
            </Link>
            <button className="btn btn-outline" type="button" onClick={() => removeMeeting(meeting.id)}>
              Remove
            </button>
            {meeting.status === "live" ? <span className="badge warn">Live</span> : null}
          </div>
          {note ? <p className="muted-line">{note}</p> : null}

          <section className="panel">
            <h2>{meeting.title}</h2>
            <p className="panel-lead">
              {meeting.platform} · {meeting.attendees.join(", ")} · {meeting.joinUrl}
            </p>
            <div className="memory-card">
              <div className="label">Atlas summary</div>
              <p>{meeting.summary}</p>
            </div>
            {meeting.notes.length > 0 ? (
              <>
                <h3 style={{ marginTop: "1rem" }}>Notes</h3>
                <ul className="plain-list">
                  {meeting.notes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted-line" style={{ marginTop: "1rem" }}>
                Start the meeting to generate notes and follow-ups.
              </p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
