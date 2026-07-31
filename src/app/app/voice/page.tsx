"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { voiceEndpoints } from "@/lib/atlas-platform";

const script = [
  { role: "owner" as const, text: "Atlas." },
  { role: "atlas" as const, text: "Yes?" },
  { role: "owner" as const, text: "How much money did we make today?" },
  { role: "atlas" as const, text: "$3,482." },
  { role: "owner" as const, text: "Who canceled?" },
  { role: "atlas" as const, text: "John Smith." },
  { role: "owner" as const, text: "Fill his spot." },
  { role: "atlas" as const, text: "I’m contacting customers now." },
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
      subtitle="Atlas works on mobile, desktop, watch, car, speakers, web, and phone calls."
      action={
        <button
          className="btn btn-dark"
          type="button"
          onClick={() => setStep((s) => Math.min(s + 1, script.length - 1))}
        >
          {step >= script.length - 1 ? "Conversation complete" : "Next line"}
        </button>
      }
    >
      <div className="stat-grid metrics-dense">
        {voiceEndpoints.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeEndpoint === item.id ? "stat voice-endpoint active" : "stat voice-endpoint"}
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
        <p className="panel-lead">{endpoint.detail}</p>
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
