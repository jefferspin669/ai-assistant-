"use client";

import Link from "@/components/SiteLink";
import { useEffect, useState } from "react";
import {
  loadCallRecords,
  loadPhoneLines,
  missedCalls,
  phoneMode,
  RECEPTION_SCENARIOS,
} from "@/lib/phone-reception-workspace";

export function PhoneReceptionStudio() {
  const [lines, setLines] = useState(loadPhoneLines());
  const [calls, setCalls] = useState(loadCallRecords());
  const missed = missedCalls();

  useEffect(() => {
    setLines(loadPhoneLines());
    setCalls(loadCallRecords());
  }, []);

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">Phone & Reception · {phoneMode()}</div>
        <p>
          Business numbers, inbound/outbound calls, routing, voicemail, transcripts, receptionist AI, and missed-call follow-up.
          {phoneMode() === "DEMO" ? " Set TWILIO_* env vars for live calls." : ""}
        </p>
      </div>

      <section className="panel">
        <h2>Business lines</h2>
        <div className="list">
          {lines.map((l) => (
            <div key={l.id} className="compliance-row">
              <div>
                <p><strong>{l.label}</strong> · {l.number}</p>
                <p className="muted-line">{l.routing} · {l.hours}</p>
              </div>
              <span className="badge">{l.live ? "LIVE" : "DEMO"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Receptionist AI</h2>
        {RECEPTION_SCENARIOS.map((s) => (
          <div key={s.id} className="memory-card" style={{ marginBottom: "0.75rem" }}>
            <div className="label">Caller: “{s.callerSays}”</div>
            <p>{s.atlasDoes}</p>
          </div>
        ))}
      </section>

      {missed.length ? (
        <section className="panel">
          <h2>Missed calls</h2>
          <p className="badge warn">{missed.length} need follow-up</p>
          <Link className="btn btn-outline" href="/app/messages">Message customers</Link>
        </section>
      ) : null}

      <section className="panel">
        <h2>Recent calls</h2>
        <div className="list">
          {calls.map((c) => (
            <div key={c.id} className="list-row">
              <span className="badge">{c.direction}</span>
              <p>
                <strong>{c.from}</strong> → {c.to} · {c.duration}
                {c.missed ? <span className="badge warn">Missed</span> : null}
                <span className="muted-line">{c.summary}</span>
                {c.transcript ? <span className="muted-line">{c.transcript}</span> : null}
              </p>
            </div>
          ))}
        </div>
        <p className="muted-line">
          Summaries sync to <Link href="/app/customers">CRM</Link> and <Link href="/app/appointments">Calendar</Link> when connected.
        </p>
      </section>
    </div>
  );
}
