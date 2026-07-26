"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { quotes } from "@/lib/data";

export default function QuotesPage() {
  const [job, setJob] = useState("Replace water heater.");
  const [generated, setGenerated] = useState(true);

  function onGenerate(e: FormEvent) {
    e.preventDefault();
    setGenerated(true);
  }

  return (
    <AppShell title="AI Quote Generator" subtitle="Type the job. Get a professional estimate customers can sign.">
      <div className="split">
        <section className="panel">
          <h2>Create estimate</h2>
          <form className="form-grid" onSubmit={onGenerate}>
            <label>
              Job description
              <textarea value={job} onChange={(e) => setJob(e.target.value)} rows={4} />
            </label>
            <button className="btn btn-dark" type="submit">
              Generate quote
            </button>
          </form>

          {generated ? (
            <div className="quote-preview" style={{ marginTop: "1rem" }}>
              <h4>Estimate · Replace water heater</h4>
              <p style={{ color: "var(--ink-soft)", marginBottom: "0.7rem" }}>Prepared for Jamie Cole</p>
              <div className="list">
                <div className="list-row">
                  <span>50-gal water heater</span>
                  <strong>$1,150</strong>
                </div>
                <div className="list-row">
                  <span>Labor + haul-away</span>
                  <strong>$580</strong>
                </div>
                <div className="list-row">
                  <span>Permit / misc</span>
                  <strong>$120</strong>
                </div>
                <div className="list-row">
                  <span>Total</span>
                  <strong>$1,850</strong>
                </div>
              </div>
              <div className="cta-row" style={{ marginTop: "1rem" }}>
                <button className="btn btn-outline" type="button">
                  Convert to PDF
                </button>
                <button className="btn btn-dark" type="button">
                  Request e-signature
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <h2>Recent quotes</h2>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Job</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td>
                    <strong>{q.title}</strong>
                    <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>{q.customer}</div>
                  </td>
                  <td>{q.amount}</td>
                  <td>
                    <span className={q.status === "Signed" ? "badge ok" : "badge"}>{q.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
