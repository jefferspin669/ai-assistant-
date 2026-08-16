"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";
import { apiGet, apiSend } from "@/lib/backend/client";
import type { DbConversation } from "@/lib/db/schema";

type ChatResult = {
  conversation: DbConversation;
  reply: string;
};

export function AiChatStudio() {
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("How is business?");
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const result = await apiGet<DbConversation[]>("/api/ai/conversations");
    if (result.ok) {
      setConversations(result.data);
      if (!activeId && result.data[0]) setActiveId(result.data[0].id);
    } else {
      setError(result.error);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const result = await apiSend<ChatResult>("/api/ai/chat", "POST", {
      message: input,
      conversationId: active?.id,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFlash("Saved to Conversations on the Atlas backend.");
    setInput("");
    setActiveId(result.data.conversation.id);
    await refresh();
  }

  return (
    <AppShell
      title="AI Chat"
      subtitle="Backend API · AI — conversations persist in `.data/atlas-db.json`."
      action={
        <Link className="btn btn-outline" href="/app">
          Dashboard
        </Link>
      }
    >
      {flash ? <p className="auth-success">{flash}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
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
                className={`bubble ${message.role === "ai" ? "bubble-ai" : "bubble-user"}`}
              >
                {message.text}
              </div>
            ))}
          </div>
          <form className="command-form" onSubmit={onSubmit}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Atlas…" />
            <button className="btn btn-dark" type="submit">
              Send
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
