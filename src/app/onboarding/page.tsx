"use client";

import Link from "next/link";
import { useState } from "react";
import { industries, type Industry } from "@/lib/data";

const personalities = ["Friendly", "Professional", "Funny", "Serious"] as const;
const languages = ["English", "Spanish", "French"] as const;

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Industry>("HVAC");
  const [name, setName] = useState("Sarah");
  const [personality, setPersonality] = useState<(typeof personalities)[number]>("Friendly");
  const [language, setLanguage] = useState<(typeof languages)[number]>("English");

  return (
    <div className="onboard">
      <div className="container">
        <div className="onboard-head">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Create your AI employee.</h1>
          <p style={{ color: "var(--ink-soft)" }}>
            Not generic AI — an employee with a name, role, personality, language, and your business
            knowledge.
          </p>
        </div>

        <div className="split" style={{ marginBottom: "1rem" }}>
          <div className="panel">
            <div className="form-grid">
              <label>
                Employee name
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Personality
                <select value={personality} onChange={(e) => setPersonality(e.target.value as typeof personality)}>
                  {personalities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                Language
                <select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)}>
                  {languages.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="panel">
            <h3>Preview</h3>
            <div className="chat-mock">
              <div className="bubble bubble-ai">
                Hello! Thanks for calling Summit {selected}. I’m {name}, the office manager. How can
                I help you today?
              </div>
              <div className="bubble bubble-user">My AC stopped working.</div>
              <div className="bubble bubble-ai">
                I’m sorry to hear that. Is the unit completely off, or is it blowing warm air?
              </div>
            </div>
            <p style={{ marginTop: "0.8rem", color: "var(--ink-soft)", fontSize: "0.9rem" }}>
              Tone: {personality} · Language: {language}
            </p>
          </div>
        </div>

        <h3 style={{ marginBottom: "0.75rem" }}>Industry knowledge</h3>
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

        <Link className="btn btn-dark" href="/app">
          Hire {name || "your AI employee"}
        </Link>
      </div>
    </div>
  );
}
