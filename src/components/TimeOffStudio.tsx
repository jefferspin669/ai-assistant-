"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decideTimeOff,
  loadTeamMembers,
  loadTimeOff,
  seedDemoTeamIfEmpty,
  staffingImpact,
  type TeamPerson,
  type TimeOffRequest,
} from "@/lib/user-workspace";

export function TimeOffStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setRequests(loadTimeOff());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setReady(true);
    const interval = window.setInterval(refresh, 6000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const pending = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);
  const decided = useMemo(() => requests.filter((r) => r.status !== "pending"), [requests]);

  function decide(id: string, status: "approved" | "rejected") {
    setRequests(decideTimeOff(id, status));
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Pending</span>
          <strong>{pending.length}</strong>
          <small>Awaiting decision</small>
        </div>
        <div className="stat">
          <span>Approved</span>
          <strong>{requests.filter((r) => r.status === "approved").length}</strong>
          <small>All time</small>
        </div>
        <div className="stat">
          <span>Rejected</span>
          <strong>{requests.filter((r) => r.status === "rejected").length}</strong>
          <small>All time</small>
        </div>
        <div className="stat">
          <span>Employees</span>
          <strong>{members.length}</strong>
          <small>On the team</small>
        </div>
      </div>

      <section className="panel">
        <h2>Pending requests</h2>
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {ready && pending.length === 0 ? (
          <p className="muted-line">No pending requests.</p>
        ) : (
          <div className="list">
            {pending.map((r) => {
              const who = members.find((m) => m.id === r.memberId);
              const impact = staffingImpact(members, requests, r);
              return (
                <div className="list-row" key={r.id}>
                  <span className="badge warn">{r.type}</span>
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{who?.name ?? "Employee"}</strong>
                      <span className="muted-line">
                        {r.startDate} → {r.endDate}
                        {r.note ? ` · ${r.note}` : ""}
                      </span>
                    </p>
                    <div className={impact.short ? "confirm-card" : "memory-card"} style={{ marginTop: "0.5rem" }}>
                      <div className="label">Staffing check · {impact.department}</div>
                      <p>
                        {impact.short ? "⚠️ " : ""}
                        Approving would leave {impact.department} with{" "}
                        <strong>{impact.available}</strong> employee{impact.available === 1 ? "" : "s"} instead of the
                        recommended <strong>{impact.recommended}</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="train-actions">
                    <button className="btn btn-dark" type="button" onClick={() => decide(r.id, "approved")}>
                      Approve
                    </button>
                    <button className="btn btn-outline" type="button" onClick={() => decide(r.id, "rejected")}>
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {decided.length ? (
        <section className="panel">
          <h2>Decided</h2>
          <div className="list">
            {decided.map((r) => {
              const who = members.find((m) => m.id === r.memberId);
              return (
                <div className="list-row" key={r.id}>
                  <span className={r.status === "approved" ? "badge ok" : "badge warn"}>{r.status}</span>
                  <p>
                    <strong>{who?.name ?? "Employee"}</strong>
                    <span className="muted-line">
                      {r.type} · {r.startDate} → {r.endDate}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
