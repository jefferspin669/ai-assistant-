"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";

type Msg = { role: "ai" | "user"; text: string };

const starter: Msg[] = [
  { role: "ai", text: "Hi — I’m the Smith Plumbing assistant. Ask about prices, hours, services, or directions." },
];

function answer(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("hour") || s.includes("open")) return "We’re open Mon–Fri 8–6 and Sat 9–1. Need an after-hours emergency slot?";
  if (s.includes("price") || s.includes("cost")) return "Drain clearing starts at $149. Water heater installs are quoted after a quick photo review.";
  if (s.includes("service")) return "We handle leaks, drains, water heaters, remodels, and emergency plumbing.";
  if (s.includes("direction") || s.includes("where")) return "We’re at 220 Market Street. I can also book a visit to your address.";
  return "I don’t want you to leave empty-handed — I created a lead for the owner and can text you a callback window.";
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Msg[]>(starter);
  const [input, setInput] = useState("");

  function onSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }, { role: "ai", text: answer(trimmed) }]);
    setInput("");
  }

  return (
      <AppShell
        title="Customer Chatbot"
        subtitle="Website chat for visitors — answers FAQs or captures the lead. This is not Ask Atlas."
      >
      <div className="split">
        <section className="panel">
          <h2>Website widget</h2>
          <div className="chat-mock" style={{ minHeight: 320 }}>
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <form onSubmit={onSend} style={{ display: "flex", gap: "0.55rem", marginTop: "0.9rem" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about prices, hours, services…"
              style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 999, padding: "0.7rem 0.9rem" }}
            />
            <button className="btn btn-dark" type="submit">
              Send
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Knowledge covered</h2>
          <div className="list">
            {["Prices", "Hours", "Services", "Directions", "FAQs", "Lead capture fallback"].map((item) => (
              <div className="list-row" key={item}>
                <span className="badge">Ready</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
