"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useState } from "react";
import { loadTodayAttention } from "@/lib/command-center";

export function DashboardAskAtlas() {
  const [query, setQuery] = useState("What needs my attention today?");
  const [answered, setAnswered] = useState(false);
  const attention = loadTodayAttention();

  function onAsk(e: FormEvent) {
    e.preventDefault();
    setAnswered(true);
  }

  return (
    <section className="panel dash-ask-compact">
      <h2>Ask Atlas</h2>
      <form className="command-form" onSubmit={onAsk}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What needs my attention today?"
          aria-label="Ask Atlas"
        />
        <button className="btn btn-dark" type="submit">Ask</button>
      </form>
      {answered || query.toLowerCase().includes("attention") ? (
        <div className="memory-card" style={{ marginTop: "0.75rem" }}>
          <div className="label">Atlas · from your workspace</div>
          <p>{attention.summary}</p>
          {attention.bullets.length ? (
            <ul className="plain-list" style={{ marginTop: "0.5rem" }}>
              {attention.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div className="cta-row" style={{ marginTop: "0.75rem" }}>
        <Link className="btn btn-outline" href="/app/ask">Open Talk to Atlas</Link>
      </div>
    </section>
  );
}
