"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FeedbackToolbar } from "@/components/FeedbackToolbar";
import {
  FEEDBACK_ACTIONS,
  loadFeedback,
  loadFeedbackPrefs,
  submitFeedback,
  type FeedbackEntry,
  type FeedbackPrefs,
} from "@/lib/feedback";

export function FeedbackStudio() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [prefs, setPrefs] = useState<FeedbackPrefs | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    setEntries(loadFeedback());
    setPrefs(loadFeedbackPrefs());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AppShell
      title="Feedback & corrections"
      subtitle="Helpful, Incorrect, Wrong category, Undo Atlas action, Report a problem, Suggest a better answer — corrections improve this user’s future experience."
    >
      <section className="panel">
        <h2>Correct Atlas</h2>
        <p className="panel-lead">Demo target: “Atlas booked Friday at 2pm and labeled it Personal.”</p>
        <label className="form-grid">
          Optional note / better answer
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="It should have been Work, not Personal." />
        </label>
        <div className="feedback-grid" style={{ marginTop: "0.85rem" }}>
          {FEEDBACK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className="btn btn-outline"
              onClick={() => {
                const result = submitFeedback({
                  kind: action.id,
                  target: "Atlas booked Friday at 2pm and labeled it Personal.",
                  note,
                });
                if (!result.ok) {
                  setError(result.error);
                  setMessage("");
                  return;
                }
                setError("");
                setMessage(result.message);
                setNote("");
                refresh();
              }}
            >
              <strong>{action.label}</strong>
              <small>{action.blurb}</small>
            </button>
          ))}
        </div>
        <div style={{ marginTop: "1rem" }}>
          <FeedbackToolbar target="Inline Atlas reply demo" />
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Learned for this user</h2>
          {prefs ? (
            <ul className="manage-list">
              <li>
                <div>
                  <strong>Prefer shorter answers</strong>
                  <span>{prefs.preferShorterAnswers ? "On" : "Off"}</span>
                </div>
              </li>
              <li>
                <div>
                  <strong>Avoid guessing categories</strong>
                  <span>{prefs.avoidGuessingCategories ? "On" : "Off"}</span>
                </div>
              </li>
              <li>
                <div>
                  <strong>Confirm before actions</strong>
                  <span>{prefs.confirmBeforeActions ? "On" : "Off"}</span>
                </div>
              </li>
              {prefs.learnedNotes.map((item, index) => (
                <li key={`${item}-${index}`}>
                  <div>
                    <strong>Memory</strong>
                    <span>{item}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="panel">
          <h2>Recent corrections</h2>
          <ul className="manage-list">
            {entries.length ? (
              entries.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>
                      [{entry.kind}] {entry.target}
                    </strong>
                    <span>
                      {entry.note || entry.applied} · {new Date(entry.at).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="muted">No feedback yet.</li>
            )}
          </ul>
        </section>
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </AppShell>
  );
}
