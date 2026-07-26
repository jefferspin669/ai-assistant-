"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { audiences, industries, type Industry } from "@/lib/data";

const personalities = ["Friendly", "Professional", "Funny", "Serious"] as const;

export default function OnboardingPage() {
  const [audience, setAudience] = useState<(typeof audiences)[number]["id"]>("business");
  const [selected, setSelected] = useState<Industry>("HVAC");
  const [name, setName] = useState("Sarah");
  const [personality, setPersonality] = useState<(typeof personalities)[number]>("Friendly");

  const nextHref = useMemo(() => {
    if (audience === "events") return "/app/events";
    if (audience === "individual" || audience === "family" || audience === "school") return "/app/personal";
    if (audience === "nonprofit") return "/app/marketplace";
    return "/app";
  }, [audience]);

  const selectedAudience = audiences.find((a) => a.id === audience)!;

  return (
    <div className="onboard">
      <div className="container">
        <div className="onboard-head">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Everyone deserves an AI employee.</h1>
          <p style={{ color: "var(--ink-soft)" }}>
            Choose who Atlas helps first. We recommend starting with small service businesses — then
            expand on the same platform.
          </p>
        </div>

        <h3 style={{ marginBottom: "0.75rem" }}>Who is this for?</h3>
        <div className="industry-grid" style={{ marginBottom: "1.25rem" }}>
          {audiences.map((item) => (
            <button
              key={item.id}
              type="button"
              className={audience === item.id ? "industry selected" : "industry"}
              onClick={() => setAudience(item.id)}
            >
              <strong>
                {item.emoji} {item.label}
              </strong>
              <span style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                {item.blurb}
              </span>
              {"beachhead" in item && item.beachhead ? (
                <span className="badge ok" style={{ marginTop: "0.55rem" }}>
                  Beachhead
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {audience === "business" ? (
          <>
            <div className="split" style={{ marginBottom: "1rem" }}>
              <div className="panel">
                <div className="form-grid">
                  <label>
                    AI employee name
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <label>
                    Personality
                    <select
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value as typeof personality)}
                    >
                      {personalities.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="panel">
                <h3>Preview</h3>
                <div className="chat-mock">
                  <div className="bubble bubble-ai">
                    Hello! Thanks for calling Summit {selected}. I’m {name}. How can I help you today?
                  </div>
                </div>
              </div>
            </div>
            <h3 style={{ marginBottom: "0.75rem" }}>Industry pack</h3>
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
          </>
        ) : (
          <div className="panel" style={{ marginBottom: "1rem" }}>
            <h3>
              {selectedAudience.emoji} {selectedAudience.label}
            </h3>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.4rem" }}>{selectedAudience.blurb}</p>
          </div>
        )}

        <Link className="btn btn-dark" href={nextHref}>
          Continue to {selectedAudience.label}
        </Link>
      </div>
    </div>
  );
}
