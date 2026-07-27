"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  hubAssistantReply,
  hubDocuments,
  hubEmployees,
  hubMessages,
  hubPerformance,
  hubPto,
  hubSchedules,
  trainingModules,
} from "@/lib/atlas-platform";

type Mode =
  | "overview"
  | "schedule"
  | "training"
  | "messages"
  | "documents"
  | "assistant"
  | "performance"
  | "pto";

type ChatMsg = { role: "ai" | "user"; text: string };

const modes: { id: Mode; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "schedule", label: "Schedule" },
  { id: "training", label: "Training" },
  { id: "messages", label: "Messages" },
  { id: "documents", label: "Documents" },
  { id: "assistant", label: "AI assistant" },
  { id: "performance", label: "Performance" },
  { id: "pto", label: "PTO" },
];

export function EmployeeHubStudio() {
  const [employeeId, setEmployeeId] = useState<(typeof hubEmployees)[number]["id"]>("alex");
  const [mode, setMode] = useState<Mode>("overview");
  const [messageDraft, setMessageDraft] = useState("");
  const [localMessages, setLocalMessages] = useState<Record<string, { from: string; when: string; text: string; unread?: boolean }[]>>({});
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantChat, setAssistantChat] = useState<Record<string, ChatMsg[]>>({});
  const [ptoDates, setPtoDates] = useState("");
  const [ptoType, setPtoType] = useState("Vacation");
  const [ptoNote, setPtoNote] = useState<string | null>(null);
  const [extraRequests, setExtraRequests] = useState<
    Record<string, { dates: string; type: string; status: string }[]>
  >({});

  const employee = useMemo(
    () => hubEmployees.find((person) => person.id === employeeId) ?? hubEmployees[0],
    [employeeId],
  );

  const schedule = hubSchedules[employeeId] ?? [];
  const messages = [...(hubMessages[employeeId] ?? []), ...(localMessages[employeeId] ?? [])];
  const documents = hubDocuments[employeeId] ?? [];
  const performance = hubPerformance[employeeId] ?? [];
  const pto = hubPto[employeeId];
  const requests = [...(pto?.requests ?? []), ...(extraRequests[employeeId] ?? [])];
  const chat = assistantChat[employeeId] ?? [
    {
      role: "ai" as const,
      text: `Hi ${employee.name.split(" ")[0]} — I’m your hub assistant. Ask about today’s schedule, manuals, refunds, or PTO.`,
    },
  ];

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    const trimmed = messageDraft.trim();
    if (!trimmed) return;
    setLocalMessages((prev) => ({
      ...prev,
      [employeeId]: [
        ...(prev[employeeId] ?? []),
        { from: employee.name, when: "Just now", text: trimmed },
      ],
    }));
    setMessageDraft("");
  }

  function askAssistant(e: FormEvent) {
    e.preventDefault();
    const trimmed = assistantInput.trim();
    if (!trimmed) return;
    const reply = hubAssistantReply(employee.name.split(" ")[0], trimmed);
    setAssistantChat((prev) => ({
      ...prev,
      [employeeId]: [
        ...(prev[employeeId] ?? chat),
        { role: "user", text: trimmed },
        { role: "ai", text: reply },
      ],
    }));
    setAssistantInput("");
  }

  function submitPto(e: FormEvent) {
    e.preventDefault();
    const dates = ptoDates.trim();
    if (!dates) return;
    setExtraRequests((prev) => ({
      ...prev,
      [employeeId]: [...(prev[employeeId] ?? []), { dates, type: ptoType, status: "Pending" }],
    }));
    setPtoNote(`Request submitted for ${dates}. Atlas checked coverage and notified Jeff.`);
    setPtoDates("");
  }

  return (
    <div className="training-studio">
      <div className="hub-employee-row" role="group" aria-label="Choose employee">
        {hubEmployees.map((person) => (
          <button
            key={person.id}
            type="button"
            className={employeeId === person.id ? "hub-employee active" : "hub-employee"}
            onClick={() => {
              setEmployeeId(person.id);
              setMode("overview");
              setPtoNote(null);
            }}
          >
            <strong>{person.name}</strong>
            <span>
              {person.role} · {person.status}
            </span>
          </button>
        ))}
      </div>

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
              Each employee gets schedule, training, messages, documents, an AI assistant, performance,
              PTO requests, and time-off balances.
            </p>
            <div className="stat-grid metrics-dense">
              <div className="stat">
                <span>Rating</span>
                <strong>{employee.rating}</strong>
                <small>Customer CSAT</small>
              </div>
              <div className="stat">
                <span>Jobs</span>
                <strong>{employee.jobsThisWeek}</strong>
                <small>This week</small>
              </div>
              <div className="stat">
                <span>Unread</span>
                <strong>{messages.filter((m) => m.unread).length}</strong>
                <small>Messages</small>
              </div>
              <div className="stat">
                <span>Vacation</span>
                <strong>{pto?.balances[0]?.days ?? 0}</strong>
                <small>Days left</small>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>Jump to</h2>
            <div className="list">
              {modes
                .filter((item) => item.id !== "overview")
                .map((item) => (
                  <div className="list-row" key={item.id}>
                    <span className="badge ok">Open</span>
                    <p>
                      <button type="button" className="linkish" onClick={() => setMode(item.id)}>
                        <strong>{item.label}</strong>
                      </button>
                    </p>
                  </div>
                ))}
            </div>
          </section>
        </div>
      ) : null}

      {mode === "schedule" ? (
        <section className="panel">
          <h2>Schedule · {employee.name.split(" ")[0]}</h2>
          <div className="calendar">
            {schedule.map((slot) => (
              <div className="cal-slot" key={slot.time + slot.job}>
                <strong>{slot.time}</strong>
                <div>
                  <div>{slot.job}</div>
                  <div style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>{slot.place}</div>
                </div>
                <span className="badge">{slot.status}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "training" ? (
        <div className="split">
          <section className="panel">
            <h2>Training progress</h2>
            <div className="list">
              {trainingModules.map((mod) => (
                <div className="list-row" key={mod.id}>
                  <span className={`badge${mod.progress >= 100 ? " ok" : mod.progress >= 50 ? "" : " warn"}`}>
                    {mod.progress}%
                  </span>
                  <div>
                    <p>
                      <strong>{mod.title}</strong>
                    </p>
                    <small className="muted-line">
                      {mod.type} · {mod.duration}
                    </small>
                    <div className="train-track" aria-hidden>
                      <div className="train-fill" style={{ width: `${mod.progress}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>Continue learning</h2>
            <p className="panel-lead">
              Atlas teaches new hires with lessons, quizzes, voice practice, and roleplay.
            </p>
            <Link className="btn btn-dark" href="/app/training">
              Open AI Training
            </Link>
          </section>
        </div>
      ) : null}

      {mode === "messages" ? (
        <section className="panel">
          <h2>Messages</h2>
          <div className="list">
            {messages.map((msg, index) => (
              <div className="list-row" key={`${msg.from}-${msg.when}-${index}`}>
                <span className={`badge${msg.unread ? " warn" : ""}`}>{msg.unread ? "New" : msg.when}</span>
                <div>
                  <p>
                    <strong>{msg.from}</strong>
                    {!msg.unread ? null : <span className="muted-line"> · {msg.when}</span>}
                  </p>
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="train-form">
            <input
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              placeholder="Message the team or Atlas…"
            />
            <button className="btn btn-dark" type="submit">
              Send
            </button>
          </form>
        </section>
      ) : null}

      {mode === "documents" ? (
        <section className="panel">
          <h2>Documents</h2>
          <p className="panel-lead">Handbooks, SOPs, certificates, and job aids pinned for this employee.</p>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.name}>
                  <td>
                    <strong>{doc.name}</strong>
                  </td>
                  <td>{doc.type}</td>
                  <td>{doc.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {mode === "assistant" ? (
        <div className="split">
          <section className="panel">
            <h2>AI assistant</h2>
            <div className="chat-mock" style={{ minHeight: 280 }}>
              {chat.map((msg, index) => (
                <div
                  key={`${msg.role}-${index}`}
                  className={`bubble ${msg.role === "ai" ? "bubble-ai" : "bubble-user"}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={askAssistant} className="train-form">
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="How do I reset this machine?"
              />
              <button className="btn btn-dark" type="submit">
                Ask
              </button>
            </form>
          </section>
          <section className="panel">
            <h2>Try asking</h2>
            <div className="list">
              {[
                "What’s on my schedule today?",
                "How do I reset this machine?",
                "How do I refund this customer?",
                "Can I take PTO next Friday?",
              ].map((prompt) => (
                <div className="list-row" key={prompt}>
                  <span className="badge">Ask</span>
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      const reply = hubAssistantReply(employee.name.split(" ")[0], prompt);
                      setAssistantChat((prev) => ({
                        ...prev,
                        [employeeId]: [
                          ...(prev[employeeId] ?? chat),
                          { role: "user", text: prompt },
                          { role: "ai", text: reply },
                        ],
                      }));
                    }}
                  >
                    {prompt}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {mode === "performance" ? (
        <section className="panel">
          <h2>Performance dashboard</h2>
          <div className="stat-grid metrics-dense">
            {performance.map((stat) => (
              <div className="stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </div>
            ))}
          </div>
          <p className="panel-lead" style={{ marginTop: "1rem", marginBottom: 0 }}>
            Atlas compares against team averages and coaching goals from AI Training.
          </p>
        </section>
      ) : null}

      {mode === "pto" ? (
        <div className="split">
          <section className="panel">
            <h2>Time-off balances</h2>
            <div className="stat-grid metrics-dense">
              {(pto?.balances ?? []).map((balance) => (
                <div className="stat" key={balance.label}>
                  <span>{balance.label}</span>
                  <strong>{balance.days}</strong>
                  <small>Days available</small>
                </div>
              ))}
            </div>
            <h3 style={{ marginTop: "1rem" }}>Requests</h3>
            <div className="list">
              {requests.map((request) => (
                <div className="list-row" key={request.dates + request.type}>
                  <span className={`badge${request.status === "Approved" ? " ok" : request.status === "Pending" ? " warn" : ""}`}>
                    {request.status}
                  </span>
                  <p>
                    <strong>{request.type}</strong>
                    <span className="muted-line">{request.dates}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>Request PTO</h2>
            <form onSubmit={submitPto} className="hub-pto-form">
              <label>
                Dates
                <input
                  value={ptoDates}
                  onChange={(e) => setPtoDates(e.target.value)}
                  placeholder="Aug 21–22"
                  required
                />
              </label>
              <label>
                Type
                <select value={ptoType} onChange={(e) => setPtoType(e.target.value)}>
                  <option>Vacation</option>
                  <option>Sick</option>
                  <option>Personal</option>
                </select>
              </label>
              <button className="btn btn-dark" type="submit">
                Submit request
              </button>
            </form>
            {ptoNote ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{ptoNote}</p> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
