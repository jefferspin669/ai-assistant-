"use client";

import { FormEvent, useState } from "react";
import { personalCapabilities, personalPrompts } from "@/lib/data";

type Msg = { role: "user" | "ai"; text: string };

function reply(q: string) {
  const s = q.toLowerCase();
  if (s.includes("driver") || s.includes("license")) {
    return "Reminder set for 30 days before your driver’s license expires (Nov 14). I’ll also add it to your calendar.";
  }
  if (s.includes("insurance") || s.includes("car")) {
    return "Found it: Progressive auto policy PDF in Documents → Vehicles. Expires March 3. Want a renewal reminder?";
  }
  if (s.includes("food") || s.includes("spend") || s.includes("budget")) {
    return "You spent $612 on food this month — $84 under your grocery budget. Dining out was the biggest slice at $240.";
  }
  return "I can manage calendar, bills, trips, budgets, groceries, study plans, fitness, documents, and appointments. What should we handle?";
}

export function PersonalLifePanel() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "I’m your personal layer inside Atlas Assistant — a life manager for bills, documents, budgets, and plans.",
    },
  ]);
  const [input, setInput] = useState("");

  function onSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }, { role: "ai", text: reply(trimmed) }]);
    setInput("");
  }

  return (
    <div className="split">
      <section className="panel">
        <h2>Personal life admin</h2>
        <p className="panel-lead">Same Atlas brain — personal context with your permission to remember what matters.</p>
        <ul className="plain-list">
          {personalCapabilities.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="panel command-panel">
        <h2>Ask your life manager</h2>
        <div className="command-thread">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="suggestion-row">
          {personalPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="suggestion"
              onClick={() =>
                setMessages((prev) => [...prev, { role: "user", text: prompt }, { role: "ai", text: reply(prompt) }])
              }
            >
              {prompt}
            </button>
          ))}
        </div>
        <form className="command-form" onSubmit={onSend}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your life admin…" />
          <button className="btn btn-dark" type="submit">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
