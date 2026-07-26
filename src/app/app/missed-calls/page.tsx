"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { missedCallLeads } from "@/lib/data";

export default function MissedCallsPage() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <AppShell
      title="Missed Calls"
      subtitle="Customer calls. Nobody answers. Atlas recovers the job instantly."
    >
      <div className="split">
        <section className="panel">
          <h2>Recovery inbox</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Problem</th>
                <th>Preferred</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {missedCallLeads.map((lead) => (
                <tr key={lead.phone}>
                  <td>
                    <strong>{lead.name}</strong>
                    <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                      {lead.phone} · {lead.address} · {lead.photos} photos
                    </div>
                  </td>
                  <td>{lead.problem}</td>
                  <td>{lead.preferred}</td>
                  <td>
                    <span className={lead.status === "New" ? "badge warn" : "badge ok"}>{lead.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Customer recovery form</h2>
          <p style={{ color: "var(--ink-soft)", marginBottom: "0.9rem" }}>
            Hi! Sorry we missed your call. Tell us how we can help.
          </p>
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Name
              <input name="name" placeholder="Full name" required />
            </label>
            <label>
              Phone
              <input name="phone" placeholder="(555) 000-0000" required />
            </label>
            <label>
              Problem
              <textarea name="problem" placeholder="What’s going on?" required />
            </label>
            <label>
              Photos
              <input name="photos" type="file" accept="image/*" multiple />
            </label>
            <label>
              Preferred appointment
              <input name="preferred" placeholder="Tomorrow morning" />
            </label>
            <label>
              Address
              <input name="address" placeholder="Street, city" />
            </label>
            <button className="btn btn-dark" type="submit">
              {submitted ? "Sent to owner instantly" : "Send details"}
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
