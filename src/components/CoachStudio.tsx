"use client";

import { FormEvent, useState } from "react";
import { coachExamples } from "@/lib/atlas-platform";
import { useLanguage } from "@/components/LanguageProvider";

type Msg = { role: "user" | "ai"; text: string };

function coachReply(q: string) {
  const s = q.toLowerCase();
  for (const ex of coachExamples) {
    const key = ex.q.toLowerCase();
    const tokens = key
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3);
    if (tokens.some((token) => s.includes(token)) || s.includes(key.slice(0, 18))) {
      return ex.a;
    }
  }
  if (s.includes("refund")) return coachExamples[0].a;
  if (s.includes("reset") || s.includes("machine")) return coachExamples[1].a;
  if (s.includes("upset") || s.includes("wait") || s.includes("angry")) return coachExamples[2].a;
  if (s.includes("warranty")) {
    return "Pull the install packet for that model — standard parts warranty is 1 year labor / 5 years manufacturer. Atlas can draft the customer SMS.";
  }
  return "Ask about refunds, machine resets, warranty language, or tough customer conversations — I’ll answer from policy, manuals, and past jobs.";
}

export function CoachStudio() {
  const { t, tAction } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "I’m your live coach. Ask in the moment — refunds, resets, warranty language, or difficult conversations.",
    },
  ]);
  const [input, setInput] = useState("");

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "ai", text: coachReply(trimmed) },
    ]);
    setInput("");
  }

  function onSend(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <div className="split">
      <section className="panel">
        <h2>Also covers</h2>
        <div className="list">
          {[
            "How do I reset this machine?",
            "What’s the warranty language for this install?",
            "Walk me through a difficult refund conversation.",
          ].map((prompt) => (
            <div className="list-row" key={prompt}>
              <span className="badge">Assist</span>
              <button type="button" className="linkish" onClick={() => ask(prompt)}>
                {prompt}
              </button>
            </div>
          ))}
        </div>
        <h3 style={{ marginTop: "1rem" }}>Example questions</h3>
        <div className="suggestion-row">
          {coachExamples.map((ex) => (
            <button key={ex.q} type="button" className="suggestion" onClick={() => ask(ex.q)}>
              {ex.q}
            </button>
          ))}
        </div>
      </section>

      <section className="panel command-panel">
        <h2>{tAction("Ask coach")}</h2>
        <div className="command-thread">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
              {m.text}
            </div>
          ))}
        </div>
        <form className="command-form" onSubmit={onSend}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How do I refund this customer?"
            aria-label="Ask the live AI coach"
          />
          <button className="btn btn-dark" type="submit">
            {t("common.send")}
          </button>
        </form>
      </section>
    </div>
  );
}
