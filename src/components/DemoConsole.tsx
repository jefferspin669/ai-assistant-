"use client";

import { FormEvent, useState } from "react";

const starterMessages = [
  {
    role: "ai" as const,
    text: "Hi — I’m Vera, the front desk for Maple Street Dental. How can I help today?",
  },
  {
    role: "user" as const,
    text: "Do you have anything open Thursday afternoon?",
  },
  {
    role: "ai" as const,
    text: "Yes — I can book Thursday at 2:30 or 4:00. Which works better, and who should I put it under?",
  },
];

type Message = { role: "ai" | "user"; text: string };

function replyFor(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("review") || q.includes("google")) {
    return "Happy to help. I’ll text a review link after today’s visit and follow up once if they haven’t left one.";
  }
  if (q.includes("quote") || q.includes("price") || q.includes("cost")) {
    return "I can draft a quote from your service menu and send it by text or email within a minute.";
  }
  if (q.includes("missed") || q.includes("call") || q.includes("phone")) {
    return "If a call is missed, I answer, take a message, and offer to book or text back while you’re with a customer.";
  }
  if (q.includes("book") || q.includes("appoint") || q.includes("thursday") || q.includes("slot")) {
    return "Locked in. I’ll confirm by text, add it to the calendar, and send a reminder the day before.";
  }
  if (q.includes("hours") || q.includes("open") || q.includes("faq")) {
    return "We’re open Mon–Fri 8–6 and Sat 9–1. Want me to answer that on the website chatbot too?";
  }
  return "Got it. I can book that, send a quote, answer FAQs, or follow up — what should I do first?";
}

export function DemoConsole() {
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [business, setBusiness] = useState("Maple Street Dental");
  const [sent, setSent] = useState(false);

  function onAsk(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    const nextUser: Message = { role: "user", text: trimmed };
    const nextAi: Message = { role: "ai", text: replyFor(trimmed) };
    setMessages((prev) => [...prev, nextUser, nextAi]);
    setInput("");
  }

  function onLead(e: FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="demo">
      <form className="demo-form" onSubmit={onLead}>
        <label>
          Business name
          <input
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="Your shop or clinic"
            required
          />
        </label>
        <label>
          Work email
          <input type="email" name="email" placeholder="you@business.com" required />
        </label>
        <label>
          What should Vera handle first?
          <textarea
            name="needs"
            placeholder="Missed calls, booking, reviews…"
            defaultValue="Missed calls and appointment booking"
          />
        </label>
        <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
          {sent ? "You’re on the list" : "Get a walkthrough"}
        </button>
      </form>

      <div className="chat" aria-live="polite">
        <div className="chat-header">
          <strong>{business || "Your business"} · Vera</strong>
          <span className="chat-status">Online now</span>
        </div>
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`bubble ${message.role === "ai" ? "bubble-ai" : "bubble-user"}`}
          >
            {message.text}
          </div>
        ))}
        <form onSubmit={onAsk} style={{ marginTop: "auto", display: "flex", gap: "0.55rem" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about booking, quotes, reviews…"
            aria-label="Message Vera"
            style={{
              flex: 1,
              border: "1px solid rgba(247,250,248,0.18)",
              borderRadius: 999,
              padding: "0.7rem 0.95rem",
              background: "rgba(247,250,248,0.08)",
              color: "#f7faf8",
              outline: "none",
            }}
          />
          <button className="btn btn-primary" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
