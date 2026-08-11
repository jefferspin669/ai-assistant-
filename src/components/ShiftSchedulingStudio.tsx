"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  acceptSwap,
  createScheduledShift,
  eligibleForShift,
  loadScheduledShifts,
  loadSwaps,
  loadTeamMembers,
  saveScheduledShifts,
  seedDemoTeamIfEmpty,
  type ScheduledShift,
  type SwapRequest,
  type TeamPerson,
} from "@/lib/user-workspace";

export function ShiftSchedulingStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [shifts, setShifts] = useState<ScheduledShift[]>([]);
  const [swaps, setSwaps] = useState<SwapRequest[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const [memberId, setMemberId] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("8:00 AM");
  const [end, setEnd] = useState("4:30 PM");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setShifts(loadScheduledShifts());
    setSwaps(loadSwaps());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    const interval = window.setInterval(refresh, 6000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const assigned = useMemo(() => shifts.filter((s) => s.status === "assigned"), [shifts]);
  const open = useMemo(() => shifts.filter((s) => s.status === "open"), [shifts]);
  const pendingSwaps = useMemo(() => swaps.filter((s) => s.status === "requested"), [swaps]);
  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "Open";

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!date) return;
    const shift = createScheduledShift({ memberId: memberId || undefined, date, start, end, role, location });
    saveScheduledShifts([shift, ...loadScheduledShifts()]);
    refresh();
    setNote(memberId ? `Shift assigned to ${nameOf(memberId)}.` : "Open shift posted — qualified employees can pick it up.");
    setRole("");
  }

  function doAcceptSwap(id: string) {
    acceptSwap(id);
    refresh();
    setNote("Swap accepted — the shift was reassigned.");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Scheduled</span>
          <strong>{assigned.length}</strong>
          <small>Assigned shifts</small>
        </div>
        <div className="stat">
          <span>Open shifts</span>
          <strong>{open.length}</strong>
          <small>Need coverage</small>
        </div>
        <div className="stat">
          <span>Swap requests</span>
          <strong>{pendingSwaps.length}</strong>
          <small>Pending</small>
        </div>
        <div className="stat">
          <span>Employees</span>
          <strong>{members.length}</strong>
          <small>Schedulable</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Create shift</h2>
          <form className="form-grid" onSubmit={onCreate}>
            <label>
              Employee
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="">— Open shift —</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} · {m.department || m.role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <div className="field-row">
              <label>
                Start
                <input value={start} onChange={(e) => setStart(e.target.value)} />
              </label>
              <label>
                End
                <input value={end} onChange={(e) => setEnd(e.target.value)} />
              </label>
            </div>
            <div className="field-row">
              <label>
                Role / qualification
                <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="HVAC" />
              </label>
              <label>
                Location
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Chicago" />
              </label>
            </div>
            <button className="btn btn-dark" type="submit">Create shift</button>
          </form>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>

        <section className="panel">
          <h2>Open shifts</h2>
          {open.length === 0 ? (
            <p className="muted-line">No open shifts.</p>
          ) : (
            <div className="list">
              {open.map((s) => {
                const eligible = members.filter((m) => eligibleForShift(s, m, shifts)).length;
                return (
                  <div className="list-row" key={s.id}>
                    <span className="badge warn">Open</span>
                    <p>
                      <strong>
                        {s.date} · {s.start}–{s.end}
                      </strong>
                      <span className="muted-line">
                        {s.role || "Any role"}
                        {s.location ? ` · ${s.location}` : ""} · {eligible} qualified & available
                      </span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <h3 style={{ marginTop: "1rem" }}>Swap requests</h3>
          {pendingSwaps.length === 0 ? (
            <p className="muted-line">No pending swaps.</p>
          ) : (
            <div className="list">
              {pendingSwaps.map((s) => {
                const shift = shifts.find((x) => x.id === s.shiftId);
                return (
                  <div className="list-row" key={s.id}>
                    <span className="badge">Swap</span>
                    <p>
                      <strong>
                        {nameOf(s.fromMemberId)} → {nameOf(s.toMemberId)}
                      </strong>
                      <span className="muted-line">{shift ? `${shift.date} ${shift.start}–${shift.end}` : "Shift"}</span>
                    </p>
                    <button className="btn btn-ghost" type="button" onClick={() => doAcceptSwap(s.id)}>
                      Accept
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>Scheduled shifts</h2>
        {assigned.length === 0 ? (
          <p className="muted-line">No shifts scheduled yet.</p>
        ) : (
          <div className="list">
            {assigned.map((s) => (
              <div className="list-row" key={s.id}>
                <span className="badge">{s.date}</span>
                <p>
                  <strong>{nameOf(s.memberId)}</strong>
                  <span className="muted-line">
                    {s.start}–{s.end}
                    {s.role ? ` · ${s.role}` : ""}
                    {s.location ? ` · ${s.location}` : ""}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
