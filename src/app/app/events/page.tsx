"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { eventPlan, eventTypes } from "@/lib/data";

export default function EventsPage() {
  const [planned, setPlanned] = useState(true);

  return (
    <AppShell
      title="Event AI"
      subtitle="Celebrations, reunions, company events — guest lists, vendors, budgets, and timelines."
      action={
        <button className="btn btn-dark" type="button" onClick={() => setPlanned(true)}>
          Plan with Atlas
        </button>
      }
    >
      <section className="panel">
        <h2>Works for</h2>
        <div className="pack-grid">
          {eventTypes.map((type) => (
            <div className="pack-chip" key={type}>
              <strong>{type}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Example</h2>
        <div className="chat-mock" style={{ marginBottom: "1rem" }}>
          <div className="bubble bubble-user">{eventPlan.prompt}</div>
          <div className="bubble bubble-ai">
            Got it — 40 guests, $1,000 budget. I built a checklist, budget split, vendor suggestions,
            and a day-of timeline.
          </div>
        </div>

        {planned ? (
          <div className="split">
            <div>
              <h3>Checklist</h3>
              <ul className="plain-list" style={{ marginTop: "0.5rem" }}>
                {eventPlan.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Budget</h3>
              <div className="list" style={{ marginTop: "0.5rem" }}>
                {eventPlan.budget.map((row) => (
                  <div className="list-row" key={row.item}>
                    <span>{row.item}</span>
                    <strong>{row.amount}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
