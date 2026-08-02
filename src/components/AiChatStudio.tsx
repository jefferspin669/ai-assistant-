"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { atlasApi } from "@/lib/api/atlas-api";
import type { DbConversation } from "@/lib/db/schema";

export function AiChatStudio() {
  const [conversations, setConversations] = useState<DbConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("How is business?");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const result = atlasApi.ai.listConversations();
    if (result.ok) {
      setConversations(result.data);
      if (result.data[0]) setActiveId(result.data[0].id);
    }
  }, []);

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = atlasApi.ai.chat(input);
    if (!result.ok) {
      setFlash(result.error);
      return;
    }
    setFlash("Saved to Conversations (database).");
    setInput("");
    setActiveId(result.data.conversation.id);
    const listed = atlasApi.ai.listConversations();
    if (listed.ok) setConversations(listed.data);
  }

  return (
    <AppShell
      title="AI Chat"
      subtitle="Backend API · AI — conversations persist in the Atlas database."
      action={
        <Link className="btn btn-outline" href="/app">
          Dashboard
        </Link>
      }
    >
      {flash ? <p className="auth-success">{flash}</p> : null}
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
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => setActiveId(chat.id)}
                  >
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
                key={`${message.at}-${index}`}
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
