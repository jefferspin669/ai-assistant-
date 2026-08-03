"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { dashboardMetrics } from "@/lib/data";

type Msg = { role: "user" | "ai"; text: string };

function dashboardReply(q: string) {
  const s = q.toLowerCase();
  if (s.includes("sales") || s.includes("revenue") || s.includes("lower") || s.includes("week")) {
    return "Two rainy days cut outdoor jobs, and Tuesday still has three open slots. Waitlist texts can fill them before Friday — want me to send?";
  }
  if (s.includes("why") && (s.includes("busy") || s.includes("slow"))) {
    return "Demand shifted to mornings after-hours emergencies rose. Scheduler can protect buffers and Marketing can push midweek offers.";
  }
  if (s.includes("overdue") || s.includes("invoice") || s.includes("cash")) {
    return "Three overdue invoices total $2,310. Top risk is payroll Friday — Atlas can chase the largest two today.";
  }
  if (s.includes("missed") || s.includes("call")) {
    return "Missed-call recovery booked two jobs overnight. Response under 2 minutes is holding CSAT.";
  }
  return "Ask about sales, cash, missed calls, or a slow day — I’ll explain the dashboard in plain language.";
}

export default function AnalyticsPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "ai",
      text: "I’m your AI Dashboard. Ask why numbers moved — revenue, cash, calls, or slow days.",
    },
  ]);
  const [input, setInput] = useState("");

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "ai", text: dashboardReply(trimmed) },
    ]);
    setInput("");
  }

  function onSend(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <AppShell
      title="AI Dashboard"
      subtitle="Instead of charts alone — ask why. Atlas explains the business in plain language."
    >
      <section className="panel">
        <h2>Snapshot</h2>
        <div className="stat-grid metrics-dense">
          {dashboardMetrics.slice(0, 8).map((item) => (
            <div className="stat" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.detail}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel command-panel">
        <h2>Ask the dashboard</h2>
        <div className="command-thread">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="suggestion-row">
          {[
            "Why were sales lower this week?",
            "What’s hurting cash?",
            "How are missed calls?",
          ].map((prompt) => (
            <button key={prompt} type="button" className="suggestion" onClick={() => ask(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
        <form className="command-form" onSubmit={onSend}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask why a metric moved…"
          />
          <button className="btn btn-dark" type="submit">
            Ask
          </button>
        </form>
      </section>
    </AppShell>
  );
}
