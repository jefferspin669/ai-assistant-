"use client";

import Link from "next/link";
import { useState } from "react";
import { industries, type Industry } from "@/lib/data";

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Industry>("Plumbing");

  return (
    <div className="onboard">
      <div className="container">
        <div className="onboard-head">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            CallFlow <span>AI</span>
          </Link>
          <h1>Choose your industry. Sarah learns the rest.</h1>
          <p style={{ color: "var(--ink-soft)" }}>
            Templates change greetings, FAQs, quote language, and booking flows for how your business
            actually talks to customers.
          </p>
        </div>

        <div className="industry-grid">
          {industries.map((industry) => (
            <button
              key={industry}
              type="button"
              className={selected === industry ? "industry selected" : "industry"}
              onClick={() => setSelected(industry)}
            >
              <strong>{industry}</strong>
            </button>
          ))}
        </div>

        <div className="panel" style={{ marginBottom: "1rem" }}>
          <h3>Preview greeting</h3>
          <div className="chat-mock">
            <div className="bubble bubble-ai">
              Hello! Thanks for calling Smith {selected}. How can I help you today?
            </div>
            <div className="bubble bubble-user">I need help as soon as possible.</div>
            <div className="bubble bubble-ai">
              I can book the next open slot, take photos of the issue, or transfer you if this is urgent.
              What’s going on?
            </div>
          </div>
        </div>

        <Link className="btn btn-dark" href="/app">
          Enter dashboard for {selected}
        </Link>
      </div>
    </div>
  );
}
