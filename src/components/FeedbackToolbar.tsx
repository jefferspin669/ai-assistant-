"use client";

import { useState } from "react";
import { FEEDBACK_ACTIONS, submitFeedback, type FeedbackKind } from "@/lib/feedback";

export function FeedbackToolbar({
  target = "Atlas reply",
  compact = false,
}: {
  target?: string;
  compact?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function onAction(kind: FeedbackKind) {
    const note =
      kind === "suggest_better"
        ? window.prompt("What should Atlas have said?") || ""
        : kind === "report_problem"
          ? window.prompt("What went wrong?") || ""
          : "";
    const result = submitFeedback({ kind, target, note });
    if (!result.ok) {
      setError(result.error);
      setMessage("");
      return;
    }
    setError("");
    setMessage(result.message);
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
            onClick={() => onAction(action.id)}
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
