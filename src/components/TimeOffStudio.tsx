"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  decideTimeOff,
  createTimeOffRequest,
  findCoverageForTimeOff,
  loadTeamMembers,
  loadTimeOff,
  requestTimeOffChange,
  seedDemoTeamIfEmpty,
  staffingImpact,
  todayISO,
  type TeamPerson,
  type TimeOffRequest,
  type TimeOffType,
} from "@/lib/user-workspace";

const TYPES: TimeOffType[] = ["PTO", "Vacation", "Sick", "Personal", "Unpaid"];

function TimeOffStudioInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "requests";
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [type, setType] = useState<TimeOffType>("PTO");
  const [portion, setPortion] = useState<"full" | "partial">("full");
  const [note, setNote] = useState("");

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setRequests(loadTimeOff());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    const m = loadTeamMembers();
    if (m[0]) setMemberId(m[0].id);
    setReady(true);
    const interval = window.setInterval(refresh, 6000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);

  function onRequest(e: FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    createTimeOffRequest({ memberId, startDate, endDate, type, portion, note });
    setNote("");
    refresh();
  }

  function approve(id: string) {
    setRequests(decideTimeOff(id, "approved"));
  }
  function deny(id: string) {
    setRequests(decideTimeOff(id, "rejected"));
  }
  function requestChange(id: string) {
    setRequests(requestTimeOffChange(id, "Please adjust dates or add coverage plan."));
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat"><span>Pending</span><strong>{pending.length}</strong></div>
        <div className="stat"><span>Approved</span><strong>{requests.filter((r) => r.status === "approved").length}</strong></div>
        <div className="stat"><span>Team</span><strong>{members.length}</strong></div>
      </div>

      {tab === "request" ? (
        <section className="panel">
          <h2>Request time off</h2>
          <form className="form-grid" onSubmit={onRequest}>
            <label>
              Employee
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>Start<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
            <label>End<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
            <label>
              Type
              <select value={type} onChange={(e) => setType(e.target.value as TimeOffType)}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>
              Day coverage
              <select value={portion} onChange={(e) => setPortion(e.target.value as "full" | "partial")}>
                <option value="full">Full day</option>
                <option value="partial">Partial day</option>
              </select>
            </label>
            <label>Note<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></label>
            <button className="btn btn-dark" type="submit">Submit request</button>
          </form>
        </section>
      ) : null}

      {tab === "requests" || tab === "coverage" ? (
        <section className="panel">
          <h2>{tab === "coverage" ? "Coverage planning" : "Manager queue"}</h2>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          <div className="list">
            {pending.map((r) => {
              const who = members.find((m) => m.id === r.memberId);
              const impact = staffingImpact(members, requests, r);
              const coverage = findCoverageForTimeOff(members, requests, r);
              return (
                <div className="list-row" key={r.id}>
                  <span className="badge warn">{r.type}</span>
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{who?.name ?? "Employee"}</strong>
                      <span className="muted-line">
                        {r.startDate} → {r.endDate} · {r.portion ?? "full"} day
                        {r.note ? ` · ${r.note}` : ""}
                      </span>
                    </p>
                    {r.managerNote ? <p className="muted-line">Manager: {r.managerNote}</p> : null}
                    <div className={impact.short ? "confirm-card" : "memory-card"} style={{ marginTop: "0.5rem" }}>
                      <div className="label">Workload impact</div>
                      <p>{coverage.message}</p>
                      {coverage.candidates.length ? (
                        <ul className="plain-list">
                          {coverage.candidates.map((c) => (
                            <li key={c.id}>{c.name} — {c.reason}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    {tab === "coverage" && coverage.understaffed ? (
                      <Link className="btn btn-outline" href="/app/workforce" style={{ marginTop: "0.5rem" }}>
                        Find coverage in Workforce
                      </Link>
                    ) : null}
                  </div>
                  {tab === "requests" ? (
                    <div className="train-actions">
                      <button className="btn btn-dark" type="button" onClick={() => approve(r.id)}>Approve</button>
                      <button className="btn btn-outline" type="button" onClick={() => deny(r.id)}>Deny</button>
                      <button className="btn btn-outline" type="button" onClick={() => requestChange(r.id)}>Request change</button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="muted-line" style={{ marginTop: "0.75rem" }}>
            <Link href="/app/time-off?tab=request">New request</Link> · Coverage is part of scheduling — not a separate Coverage Mode page.
          </p>
        </section>
      ) : null}
    </div>
  );
}

export function TimeOffStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading time off…</p>}>
      <TimeOffStudioInner />
    </Suspense>
  );
}
