"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function DashboardAskAtlas() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function onAsk(e: FormEvent) {
    e.preventDefault();
    const prompt = query.trim();
    if (!prompt) return;
    router.push(`/app/ask?prompt=${encodeURIComponent(prompt)}`);
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
      <div className="cta-row" style={{ marginTop: "0.75rem" }}>
        <Link className="btn btn-outline" href="/app/ask">Open Talk to Atlas</Link>
      </div>
    </section>
  );
}
