"use client";

import Link from "next/link";

const pillars = [
  {
    title: "Not just software",
    detail:
      "Features matter, but they serve a purpose: giving every business an intelligent workforce.",
  },
  {
    title: "Size shouldn’t decide access",
    detail:
      "A five-person shop deserves the same digital employees, memory, and judgment as a national brand.",
  },
  {
    title: "Memorable on purpose",
    detail:
      "“Every business deserves an intelligent workforce, regardless of its size.” That’s the north star for product, pricing, and go-to-market.",
  },
] as const;

export function MissionStudio() {
  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Atlas Mission</p>
          <h2>Every business deserves an intelligent workforce, regardless of its size.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            Don’t just sell software. Build around a mission — purpose beyond technology, memorable
            enough to guide every product decision.
          </p>
        </div>
        <div className="stat" style={{ background: "rgba(244,248,247,0.08)", border: "none" }}>
          <span style={{ color: "rgba(244,248,247,0.7)" }}>North star</span>
          <strong style={{ color: "var(--foam)" }}>Mission</strong>
          <small style={{ color: "#9ed0b2" }}>Before features</small>
        </div>
      </section>

      <div className="pack-grid dense">
        {pillars.map((item) => (
          <div className="domain-card" key={item.title}>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2>How we live it</h2>
        <p className="panel-lead">
          Start with small service businesses that feel the gap hardest — then keep expanding the
          same intelligent workforce to every size of company.
        </p>
        <div className="chat-mock" style={{ marginTop: "0.85rem" }}>
          <div className="bubble bubble-user">We’re too small for enterprise AI.</div>
          <div className="bubble bubble-ai">
            That’s exactly who Atlas is for. Size shouldn’t decide who gets an intelligent workforce.
          </div>
        </div>
        <div className="cta-row" style={{ marginTop: "1rem" }}>
          <Link className="btn btn-dark" href="/app/digital-employees">
            Meet the workforce
          </Link>
          <Link className="btn btn-outline" href="/onboarding">
            Create yours
          </Link>
        </div>
      </section>
    </div>
  );
}
