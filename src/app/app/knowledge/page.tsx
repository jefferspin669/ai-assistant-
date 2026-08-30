"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { knowledgeQa, knowledgeUploads } from "@/lib/atlas-platform";
import { knowledgeHub } from "@/lib/section-hubs";

export default function KnowledgePage() {
  const [query, setQuery] = useState("What’s our return policy?");
  const [answer, setAnswer] = useState(knowledgeQa[0]);

  function ask(q: string) {
    setQuery(q);
    const match =
      knowledgeQa.find((item) => item.q.toLowerCase() === q.toLowerCase()) ??
      knowledgeQa.find((item) => q.toLowerCase().includes("return")) ??
      knowledgeQa[0];
    setAnswer(match);
  }

  return (
    <AppShell
      title="Knowledge"
      subtitle="Atlas answers from your docs. Other memory tools live in this section — not as extra sidebar items."
    >
      <div className="split">
        <section className="panel">
          <h2>Library</h2>
          <p className="panel-lead">Sample files · DEMO until you upload real documents.</p>
          <div className="list">
            {knowledgeUploads.map((item) => (
              <div className="list-row" key={item.name}>
                <span className={`badge${item.status === "Learned" ? " ok" : ""}`}>
                  {item.status}
                </span>
                <p>
                  <strong>{item.name}</strong>
                  <span className="muted-line">
                    {item.type} · {item.pages === 1 ? "1 item" : `${item.pages} pages`}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Ask the business</h2>
          <p className="panel-lead">Employees ask in plain English. Atlas cites your docs.</p>
          <div className="quality-filter-row">
            {knowledgeQa.map((item) => (
              <button
                key={item.q}
                type="button"
                className={query === item.q ? "training-tab active" : "training-tab"}
                onClick={() => ask(item.q)}
              >
                {item.q}
              </button>
            ))}
          </div>
          <div className="chat-mock" style={{ marginTop: "1rem" }}>
            <div className="bubble bubble-user">
              <div className="agent-tag">Employee</div>
              {query}
            </div>
            <div className="bubble bubble-ai">
              <div className="agent-tag">Atlas</div>
              {answer.a}
              <span className="muted-line" style={{ display: "block", marginTop: "0.5rem" }}>
                Source · {answer.source}
              </span>
            </div>
          </div>
        </section>
      </div>

      <h2 className="hub-heading">Also in Knowledge</h2>
      <div className="hub-grid">
        {knowledgeHub
          .filter((item) => item.href !== "/app/knowledge")
          .map((item) => (
            <Link className="hub-card" href={item.href} key={item.href}>
              <h3>{item.label}</h3>
              <p>{item.blurb}</p>
            </Link>
          ))}
      </div>
    </AppShell>
  );
}
