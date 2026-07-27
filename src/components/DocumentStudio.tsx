"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  documentBuilderReply,
  documentDrafts,
  documentTypes,
} from "@/lib/atlas-platform";

type Mode = "templates" | "drafts" | "compose";
type ChatMsg = { role: "ai" | "user"; text: string };

const modes: { id: Mode; label: string }[] = [
  { id: "templates", label: "Templates" },
  { id: "drafts", label: "Drafts" },
  { id: "compose", label: "Compose" },
];

export function DocumentStudio() {
  const [mode, setMode] = useState<Mode>("templates");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string>(documentDrafts[0].id);
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({});
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      role: "ai",
      text: "I can create contracts, quotes, invoices, letters, reports, policies, forms, and proposals from Atlas Brain. What should I draft?",
    },
  ]);
  const [note, setNote] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      typeFilter === "All"
        ? documentDrafts
        : documentDrafts.filter((draft) => draft.type === typeFilter),
    [typeFilter],
  );

  const selected = documentDrafts.find((draft) => draft.id === selectedId) ?? documentDrafts[0];

  function compose(prompt: string) {
    const reply = documentBuilderReply(prompt);
    setChat((prev) => [...prev, { role: "user", text: prompt }, { role: "ai", text: reply }]);
    setMode("compose");
  }

  function onCompose(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    compose(trimmed);
    setInput("");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Templates</span>
          <strong>{documentTypes.length}</strong>
          <small>Document kinds</small>
        </div>
        <div className="stat">
          <span>Drafts ready</span>
          <strong>{documentDrafts.filter((d) => d.status === "Ready").length}</strong>
          <small>Can send now</small>
        </div>
        <div className="stat">
          <span>In progress</span>
          <strong>{documentDrafts.filter((d) => d.status === "Draft").length}</strong>
          <small>Needs polish</small>
        </div>
        <div className="stat">
          <span>Sent / signed</span>
          <strong>
            {documentDrafts.filter((d) => d.status === "Signed").length +
              Object.keys(sentIds).length}
          </strong>
          <small>This week</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Document builder modes">
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

      {mode === "templates" ? (
        <section className="panel">
          <h2>What Atlas creates</h2>
          <p className="panel-lead">
            Contracts, quotes, invoices, letters, reports, policies, forms, and proposals — drafted
            from business knowledge.
          </p>
          <div className="create-type-grid">
            {documentTypes.map((type) => (
              <button
                key={type}
                type="button"
                className="quality-pattern-card"
                onClick={() => {
                  setTypeFilter(type);
                  setMode("drafts");
                  const match = documentDrafts.find((draft) => draft.type === type);
                  if (match) setSelectedId(match.id);
                }}
              >
                <h3 style={{ marginBottom: "0.35rem" }}>{type}</h3>
                <p className="muted-line">
                  {documentDrafts.filter((draft) => draft.type === type).length} example
                  {documentDrafts.filter((draft) => draft.type === type).length === 1 ? "" : "s"}
                </p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "drafts" ? (
        <div className="split">
          <section className="panel">
            <h2>Draft library</h2>
            <div className="quality-filter-row">
              {["All", ...documentTypes].map((type) => (
                <button
                  key={type}
                  type="button"
                  className={typeFilter === type ? "training-tab active" : "training-tab"}
                  onClick={() => setTypeFilter(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="list" style={{ marginTop: "0.9rem" }}>
              {filtered.map((draft) => (
                <button
                  key={draft.id}
                  type="button"
                  className={selectedId === draft.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setSelectedId(draft.id)}
                >
                  <span className={`badge${sentIds[draft.id] || draft.status === "Signed" ? " ok" : draft.status === "Draft" ? " warn" : ""}`}>
                    {sentIds[draft.id] ? "Sent" : draft.status}
                  </span>
                  <div>
                    <p>
                      <strong>{draft.title}</strong>
                    </p>
                    <small className="muted-line">{draft.type}</small>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>{selected.title}</h2>
            <div className="memory-card">
              <div className="label">Preview</div>
              <p>{selected.preview}</p>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                disabled={Boolean(sentIds[selected.id]) || selected.status === "Signed"}
                onClick={() => {
                  setSentIds((prev) => ({ ...prev, [selected.id]: true }));
                  setNote(`Sent “${selected.title}” for e-sign / delivery.`);
                }}
              >
                {sentIds[selected.id] || selected.status === "Signed" ? "Already sent" : "Send / e-sign"}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => compose(selected.prompt)}
              >
                Redraft in chat
              </button>
            </div>
            {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
          </section>
        </div>
      ) : null}

      {mode === "compose" ? (
        <div className="split">
          <section className="panel">
            <h2>Compose with Atlas</h2>
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
            <form onSubmit={onCompose} className="train-form">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Create a maintenance agreement for Jamie Cole."
              />
              <button className="btn btn-dark" type="submit">
                Draft
              </button>
            </form>
          </section>
          <section className="panel">
            <h2>Quick prompts</h2>
            <div className="list">
              {documentDrafts.slice(0, 5).map((draft) => (
                <div className="list-row" key={draft.id}>
                  <span className="badge">{draft.type}</span>
                  <button type="button" className="linkish" onClick={() => compose(draft.prompt)}>
                    {draft.prompt}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
