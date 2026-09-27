"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiGet, apiSend } from "@/lib/backend/client";
import { atlasApi } from "@/lib/api/atlas-api";
import type { DbConversation } from "@/lib/db/schema";

type ChatResult = {
  conversation: DbConversation;
  reply: string;
};

async function loadConversations() {
  const remote = await apiGet<DbConversation[]>("/api/ai/conversations");
  if (remote.ok) return { ok: true as const, data: remote.data, source: "backend" as const };
  const local = atlasApi.ai.listConversations();
  if (local.ok) return { ok: true as const, data: local.data, source: "local" as const };
  return { ok: false as const, error: remote.error || local.error };
}

async function sendMessage(message: string, conversationId?: string) {
  const remote = await apiSend<ChatResult>("/api/ai/chat", "POST", {
    message,
    conversationId,
  });
  if (remote.ok) return { ok: true as const, data: remote.data, source: "backend" as const };
  const local = atlasApi.ai.chat(message);
  if (local.ok) {
    return {
      ok: true as const,
      data: { reply: local.data.reply, conversation: local.data.conversation },
      source: "local" as const,
    };
  }
  return { ok: false as const, error: remote.error || local.error };
}

export function AiChatStudio() {
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("How is business?");
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [persistMode, setPersistMode] = useState<"backend" | "local" | null>(null);

  async function refresh() {
    const result = await loadConversations();
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setConversations(result.data);
    setPersistMode(result.source);
    setError("");
    if (!activeId && result.data[0]) setActiveId(result.data[0].id);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setError("");
    const result = await sendMessage(trimmed, active?.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPersistMode(result.source);
    setFlash(
      result.source === "backend"
        ? "Saved to Conversations on the Atlas backend."
        : "Saved to Conversations in your browser vault.",
    );
    setInput("");
    setActiveId(result.data.conversation.id);
    await refresh();
  }

  return (
    <AppShell
      title="AI Chat"
      subtitle="Backend API · AI — conversations persist in `.data/atlas-db.json` when the server is running, or in your browser vault on static preview."
      action={
        <Link className="btn btn-outline" href="/app">
          Dashboard
        </Link>
      }
    >
      {flash ? <p className="auth-success">{flash}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {persistMode === "local" && !error ? (
        <p className="panel-lead">
          Using browser vault — run <code>npm run dev</code> for file-backed conversations on the server.
        </p>
      ) : null}
      <div className="split">
        <section className="panel">
          <h2>Conversations</h2>
          <ul className="manage-list">
            {conversations.length === 0 ? (
              <li>No conversations yet.</li>
            ) : (
              conversations.map((chat) => (
                <li key={chat.id}>
                  <div>
                    <strong>{chat.title}</strong>
                    <small>{chat.preview}</small>
                  </div>
                  <button type="button" className="ghost-link" onClick={() => setActiveId(chat.id)}>
                    Open
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="panel command-panel">
          <h2>{active?.title || "New chat"}</h2>
          <div className="command-thread" aria-live="polite">
            {(active?.messages || []).map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={message.role === "user" ? "bubble bubble-user" : "bubble bubble-ai"}
              >
                {message.role === "ai" ? <div className="agent-tag">Atlas</div> : null}
                <p style={{ margin: 0 }}>{message.text}</p>
              </div>
            ))}
          </div>
          <form className="command-form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Atlas…"
              required
            />
            <button className="btn btn-dark" type="submit">
              Send
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
