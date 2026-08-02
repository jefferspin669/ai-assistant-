"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  CAPTURE_KINDS,
  convertCapture,
  createCapture,
  loadCaptures,
  saveCaptures,
  type CaptureKind,
  type CaptureNote,
} from "@/lib/quick-capture";
import { enqueueOfflineChange, isOffline, refreshOfflineCache } from "@/lib/offline";
import { runSaveCycle } from "@/lib/sync-status";

export function QuickCaptureStudio() {
  const [notes, setNotes] = useState<CaptureNote[]>([]);
  const [kind, setKind] = useState<CaptureKind>("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [checklistText, setChecklistText] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setNotes(loadCaptures());
  }, []);

  async function persist(next: CaptureNote[], note: string) {
    saveCaptures(next);
    setNotes(next);
    refreshOfflineCache();
    if (isOffline()) {
      enqueueOfflineChange(note);
      setMessage(`${note} (queued offline)`);
      return;
    }
    await runSaveCycle("Note");
    setMessage(note);
  }

  async function onCapture(e: FormEvent) {
    e.preventDefault();
    const note = createCapture({
      kind,
      title,
      body:
        kind === "voice"
          ? body || "Voice note captured (demo transcript)."
          : kind === "photo"
            ? body || "Photo attached for later."
            : body,
      linkUrl: kind === "link" ? linkUrl || "https://example.com" : undefined,
      photoName: kind === "photo" ? title || "capture.jpg" : undefined,
      voiceSeconds: kind === "voice" ? 18 : undefined,
      checklist:
        kind === "checklist"
          ? checklistText
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
          : undefined,
    });
    await persist([note, ...notes], `Saved ${kind} note.`);
    setTitle("");
    setBody("");
    setLinkUrl("");
    setChecklistText("");
  }

  function onConvert(id: string, target: "task" | "event" | "customer" | "reminder") {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const result = convertCapture(note, target);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    persist(
      notes.map((n) => (n.id === id ? result.note : n)),
      result.label,
    );
  }

  return (
    <AppShell
      title="Notes & quick capture"
      subtitle="Save text, voice, photos, checklists, links, and ideas — then turn them into tasks, events, customers, or reminders."
    >
      <div className="split">
        <section className="panel">
          <h2>Capture now</h2>
          <div className="cta-row" style={{ flexWrap: "wrap", marginBottom: "0.85rem" }}>
            {CAPTURE_KINDS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`biz-chip ${kind === item.id ? "active" : ""}`}
                onClick={() => setKind(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <form className="form-grid" onSubmit={onCapture}>
            <label>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What should Atlas remember?" />
            </label>
            {kind === "link" ? (
              <label>
                Link
                <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://" />
              </label>
            ) : null}
            {kind === "checklist" ? (
              <label>
                Checklist items (one per line)
                <textarea rows={5} value={checklistText} onChange={(e) => setChecklistText(e.target.value)} />
              </label>
            ) : (
              <label>
                {kind === "voice" ? "Transcript / note" : kind === "photo" ? "Caption" : "Details"}
                <textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
              </label>
            )}
            <button className="btn btn-dark" type="submit">
              Save {kind} note
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Inbox</h2>
          <div className="capture-list">
            {notes.map((note) => (
              <article key={note.id} className="capture-card">
                <header>
                  <span className="biz-chip">{note.kind}</span>
                  <strong>{note.title}</strong>
                </header>
                {note.body ? <p>{note.body}</p> : null}
                {note.linkUrl ? (
                  <p className="muted">
                    <a href={note.linkUrl} target="_blank" rel="noreferrer">
                      {note.linkUrl}
                    </a>
                  </p>
                ) : null}
                {note.photoName ? <p className="muted">Photo · {note.photoName}</p> : null}
                {note.voiceSeconds != null ? <p className="muted">Voice · {note.voiceSeconds}s</p> : null}
                {note.checklist.length ? (
                  <ul className="capture-checklist">
                    {note.checklist.map((item) => (
                      <li key={item.id}>
                        {item.done ? "✓" : "○"} {item.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {note.convertedTo ? (
                  <p className="auth-success">
                    Converted to {note.convertedTo.type}: {note.convertedTo.label}
                  </p>
                ) : (
                  <div className="cta-row" style={{ marginTop: "0.65rem" }}>
                    <button type="button" className="btn btn-outline" onClick={() => onConvert(note.id, "task")}>
                      → Task
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => onConvert(note.id, "event")}>
                      → Event
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => onConvert(note.id, "customer")}>
                      → Customer
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => onConvert(note.id, "reminder")}>
                      → Reminder
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
