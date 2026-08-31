"use client";

import Link from "@/components/SiteLink";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReceptionistControlStudio } from "@/components/ReceptionistControlStudio";
import { proposeMemoryCorrection } from "@/lib/business-memory";
import {
  loadCallRecords,
  loadPhoneLines,
  missedCalls,
  phoneMode,
  RECEPTION_SCENARIOS,
} from "@/lib/phone-reception-workspace";
import {
  completeBookingFlow,
  loadReceptionistConfig,
  offerWednesdayAfternoonSlots,
} from "@/lib/receptionist-assistant";

function PhoneReceptionStudioInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "calls";
  const [lines, setLines] = useState(loadPhoneLines());
  const [calls, setCalls] = useState(loadCallRecords());
  const [bookingSteps, setBookingSteps] = useState<{ id: string; label: string; done: boolean }[] | null>(null);
  const [correctionNote, setCorrectionNote] = useState<string | null>(null);
  const [pendingCorrection, setPendingCorrection] = useState<string | null>(null);
  const missed = missedCalls();
  const assistantCfg = loadReceptionistConfig();

  useEffect(() => {
    setLines(loadPhoneLines());
    setCalls(loadCallRecords());
  }, []);

  function simulateWednesdayBooking(slot: string, employee: string) {
    const steps = completeBookingFlow("Elena Brooks", slot, employee);
    setBookingSteps(steps);
  }

  function onOwnerCorrection(text: string) {
    const pending = proposeMemoryCorrection(text, "company", "Owner correction");
    setPendingCorrection(pending.content);
    setCorrectionNote("Save to Business Memory? Review on the Memory page or confirm there.");
  }

  const offer = offerWednesdayAfternoonSlots();

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">Account Assistant · {phoneMode()} · {assistantCfg.autonomyMode}</div>
        <p>
          Receptionist across phone, calendar, CRM, and{" "}
          <Link href="/app/memory">Business Memory</Link>.{" "}
          <Link href="/app/phone?tab=control">Control Center</Link> sets autonomy and permissions.
        </p>
      </div>

      <div className="training-tabs" role="tablist">
        <a href="/app/phone?tab=calls" className={tab === "calls" ? "training-tab active" : "training-tab"}>Calls</a>
        <a href="/app/phone?tab=assistant" className={tab === "assistant" ? "training-tab active" : "training-tab"}>Live demo</a>
        <a href="/app/phone?tab=control" className={tab === "control" ? "training-tab active" : "training-tab"}>Control Center</a>
        <a href="/app/phone?tab=correct" className={tab === "correct" ? "training-tab active" : "training-tab"}>Correct Atlas</a>
      </div>

      {tab === "control" ? <ReceptionistControlStudio /> : null}

      {tab === "assistant" ? (
        <section className="panel">
          <h2>Wednesday afternoon booking</h2>
          <p className="panel-lead">Caller: “Do you have an opening Wednesday afternoon?”</p>
          <div className="memory-card">
            <div className="label">Atlas</div>
            <p>{offer.message}</p>
          </div>
          <div className="cta-row">
            {offer.slots.map((s) => (
              <button
                key={s.time}
                className="btn btn-outline"
                type="button"
                onClick={() => simulateWednesdayBooking(s.time, s.employee)}
              >
                Book {s.time} — {s.employee}
              </button>
            ))}
          </div>
          {bookingSteps ? (
            <div className="list" style={{ marginTop: "1rem" }}>
              {bookingSteps.map((step) => (
                <div key={step.id} className="list-row">
                  <span className={step.done ? "badge ok" : "badge"}>{step.done ? "✓" : "…"}</span>
                  <p>{step.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "correct" ? (
        <section className="panel">
          <h2>Correct Atlas</h2>
          <p className="panel-lead">Example: “We no longer offer Sunday appointments.”</p>
          <button
            className="btn btn-dark"
            type="button"
            onClick={() => onOwnerCorrection("We no longer offer Sunday appointments.")}
          >
            Teach Atlas this rule
          </button>
          {correctionNote ? (
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <p>{correctionNote}</p>
              {pendingCorrection ? <p><strong>{pendingCorrection}</strong></p> : null}
              <Link className="btn btn-outline" href="/app/memory">Open Business Memory</Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "calls" ? (
        <>
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
            <h2>Scenarios</h2>
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
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

export function PhoneReceptionStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading phone…</p>}>
      <PhoneReceptionStudioInner />
    </Suspense>
  );
}
