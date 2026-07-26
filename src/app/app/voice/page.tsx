"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";

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
  const visible = script.slice(0, step + 1);

  return (
    <AppShell
      title="Voice Mode"
      subtitle="Owner driving. Atlas listening. Business still moving."
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
      <section className="panel voice-stage">
        <div className="voice-orb" aria-hidden="true" />
        <h2>Atlas is listening</h2>
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
