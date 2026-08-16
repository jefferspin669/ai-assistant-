"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  HELP_ARTICLES,
  SERVICE_COMPONENTS,
  TUTORIALS,
  answerSupportQuestion,
  createTicket,
  escalateTicket,
  loadTickets,
  type SupportTicket,
  type SupportTicketKind,
} from "@/lib/support";
import {
  acknowledgeError,
  loadErrorLog,
  simulateFailedSave,
  type FriendlyError,
} from "@/lib/errors";
import { setSyncStatus } from "@/lib/sync-status";

export function SupportStudio() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [errors, setErrors] = useState<FriendlyError[]>([]);
  const [kind, setKind] = useState<SupportTicketKind>("support");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [message, setMessage] = useState("");
  const [latestError, setLatestError] = useState<FriendlyError | null>(null);

  useEffect(() => {
    setTickets(loadTickets());
    setErrors(loadErrorLog());
  }, []);

  function onAsk(e: FormEvent) {
    e.preventDefault();
    const result = answerSupportQuestion(question);
    setAnswer(result.answer + (result.suggestHuman ? " I can also pass this to a person." : ""));
  }

  function onTicket(e: FormEvent) {
    e.preventDefault();
    const ticket = createTicket({ kind, subject, detail });
    setTickets(loadTickets());
    setMessage(`Ticket opened — Atlas replied first${ticket.status === "escalated" ? " and escalated" : ""}.`);
    setSubject("");
    setDetail("");
  }

  function demoError() {
    const err = simulateFailedSave("event");
    setErrors(loadErrorLog());
    setLatestError(err);
    setSyncStatus("needs_attention", err.userMessage);
  }

  return (
    <AppShell
      title="Support center"
      subtitle="Help articles, tutorials, contact support, bug reports, feature requests, account recovery, and service status — Atlas answers first."
    >
      {latestError && !latestError.acknowledged ? (
        <div className="friendly-error" role="alert">
          <div>
            <strong>Something needs attention</strong>
            <p>{latestError.userMessage}</p>
            <p className="muted">Technical details were recorded for the Atlas team — not shown here.</p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              acknowledgeError(latestError.id);
              setLatestError({ ...latestError, acknowledged: true });
              setErrors(loadErrorLog());
              setSyncStatus("synced");
            }}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="split">
        <section className="panel">
          <h2>Ask Atlas first</h2>
          <form className="form-grid" onSubmit={onAsk}>
            <label>
              Support question
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="How do I work offline?"
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Get answer
            </button>
          </form>
          {answer ? <p className="support-answer">{answer}</p> : null}

          <h3 style={{ marginTop: "1.25rem" }}>Help articles</h3>
          <ul className="manage-list">
            {HELP_ARTICLES.map((article) => (
              <li key={article.id}>
                <div>
                  <strong>{article.title}</strong>
                  <span>
                    {article.category} · {article.body}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Guided tutorials</h2>
          <ul className="manage-list">
            {TUTORIALS.map((tutorial) => (
              <li key={tutorial.id}>
                <div>
                  <strong>{tutorial.title}</strong>
                  <span>{tutorial.steps.join(" → ")}</span>
                </div>
                <Link className="btn btn-outline" href={tutorial.href}>
                  Start
                </Link>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: "1.25rem" }}>Service status</h2>
          <ul className="manage-list">
            {SERVICE_COMPONENTS.map((item) => (
              <li key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </div>
                <span className={`status-pill ${item.status}`}>{item.status}</span>
              </li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: "0.65rem" }}>
            Full public status also lives at <Link href="/status">/status</Link>.
          </p>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Contact support / report / request</h2>
          <form className="form-grid" onSubmit={onTicket}>
            <label>
              Type
              <select value={kind} onChange={(e) => setKind(e.target.value as SupportTicketKind)}>
                <option value="support">Contact support</option>
                <option value="bug">Bug report</option>
                <option value="feature">Feature request</option>
                <option value="recovery">Account recovery</option>
              </select>
            </label>
            <label>
              Subject
              <input value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </label>
            <label>
              Details
              <textarea rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} required />
            </label>
            <button className="btn btn-dark" type="submit">
              Submit — Atlas answers first
            </button>
          </form>

          <ul className="manage-list" style={{ marginTop: "1rem" }}>
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <div>
                  <strong>
                    [{ticket.kind}] {ticket.subject}
                  </strong>
                  <span>
                    {ticket.status} · {ticket.thread[ticket.thread.length - 1]?.text}
                  </span>
                </div>
                {ticket.status !== "escalated" ? (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      escalateTicket(ticket.id);
                      setTickets(loadTickets());
                      setMessage("Passed to a person.");
                    }}
                  >
                    Talk to a person
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Friendly error handling</h2>
          <p className="panel-lead">
            Users never see “Error 500”. They see a clear message while technical details stay in the backend log.
          </p>
          <div className="cta-row">
            <button type="button" className="btn btn-dark" onClick={demoError}>
              Simulate save failure
            </button>
          </div>
          <ul className="manage-list" style={{ marginTop: "1rem" }}>
            {errors.length ? (
              errors.map((err) => (
                <li key={err.id}>
                  <div>
                    <strong>{err.userMessage}</strong>
                    <span>
                      Code {err.code} · logged {new Date(err.at).toLocaleString()}
                      {err.acknowledged ? " · dismissed" : ""}
                    </span>
                    <details className="tech-details">
                      <summary>Technical details (team only)</summary>
                      <pre>{err.technical}</pre>
                    </details>
                  </div>
                </li>
              ))
            ) : (
              <li className="muted">No errors logged yet.</li>
            )}
          </ul>
        </section>
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
