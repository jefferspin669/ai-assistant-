"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { voiceEndpoints } from "@/lib/atlas-platform";

const script = [
  {
    role: "owner" as const,
    text: "Atlas, create an invoice for Acme Corp for $1,250, email it, remind them in 7 days if it’s unpaid, and update my books.",
  },
  {
    role: "atlas" as const,
    text: "On it — invoice drafted, email queued, 7-day reminder armed, books updating.",
  },
  { role: "owner" as const, text: "I’m getting in the car — continue there." },
  {
    role: "atlas" as const,
    text: "Same conversation on CarPlay. Invoice sent. Want a spoken summary when it posts?",
  },
  { role: "owner" as const, text: "Yes. And ping my watch if they pay." },
  {
    role: "atlas" as const,
    text: "Watch alert set. Thread stays open across phone, desktop, watch, car, speakers, and web.",
  },
];

export default function VoicePage() {
  const [step, setStep] = useState(0);
  const [activeEndpoint, setActiveEndpoint] = useState(voiceEndpoints[5].id);
  const visible = script.slice(0, step + 1);
  const endpoint =
    voiceEndpoints.find((item) => item.id === activeEndpoint) ?? voiceEndpoints[5];

  return (
    <AppShell
      title="Voice Everywhere"
      subtitle="The conversation continues seamlessly across every device — mobile, desktop, watch, car, speakers, web, and phone."
      action={
        <div className="cta-row">
          <Link className="btn btn-outline" href="/app/actions">
            Atlas Actions
          </Link>
          <button
            className="btn btn-dark"
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, script.length - 1))}
          >
            {step >= script.length - 1 ? "Conversation complete" : "Next line"}
          </button>
        </div>
      }
    >
      <div className="stat-grid metrics-dense">
        {voiceEndpoints.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              activeEndpoint === item.id ? "stat voice-endpoint active" : "stat voice-endpoint"
            }
            onClick={() => setActiveEndpoint(item.id)}
          >
            <span>{item.name}</span>
            <strong>{item.status}</strong>
            <small>{item.detail}</small>
          </button>
        ))}
      </div>

      <section className="panel voice-stage">
        <div className="voice-orb" aria-hidden="true" />
        <h2>Listening on {endpoint.name}</h2>
        <p className="panel-lead">
          {endpoint.detail}. Switch devices anytime — Atlas keeps the Action and the thread.
        </p>
        <div className="chat-mock" style={{ marginTop: "1rem" }}>
          {visible.map((line, index) => (
            <div
              key={`${line.text}-${index}`}
              className={`bubble ${line.role === "owner" ? "bubble-user" : "bubble-ai"}`}
            >
              <div className="agent-tag">{line.role === "owner" ? "Jeff" : "Atlas"}</div>
              {line.text}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
