"use client";

import { useState } from "react";
import { FEEDBACK_ACTIONS, submitFeedback, type FeedbackKind } from "@/lib/feedback";

export function FeedbackToolbar({
  target = "Atlas reply",
  compact = false,
  onSubmitted,
}: {
  target?: string;
  compact?: boolean;
  onSubmitted?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onAction(kind: FeedbackKind) {
    const note =
      kind === "suggest_better"
        ? window.prompt("What should Atlas have said?") || ""
        : kind === "report_problem"
          ? window.prompt("What went wrong? Add a few details.") || ""
          : "";
    const local = submitFeedback({ kind, target, note });
    if (!local.ok) {
      setError(local.error);
      setMessage("");
      return;
    }
    setBusy(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, target, note }),
      });
    } catch {
      /* local feedback still applied */
    } finally {
      setBusy(false);
    }
    setError("");
    setMessage(local.message);
    onSubmitted?.();
  }

  return (
    <div className={`feedback-toolbar${compact ? " compact" : ""}`}>
      <span className="muted">Was this right?</span>
      <div className="cta-row" style={{ flexWrap: "wrap" }}>
        {FEEDBACK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            className="biz-chip"
            disabled={busy}
            onClick={() => void onAction(action.id)}
            title={action.blurb}
          >
            {action.label}
          </button>
        ))}
      </div>
      {message ? <p className="auth-success">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
