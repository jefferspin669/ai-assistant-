"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  decideExpense,
  loadExpenses,
  loadTeamMembers,
  seedDemoTeamIfEmpty,
  timesheetFor,
  type Expense,
  type TeamPerson,
  type Timesheet,
} from "@/lib/user-workspace";

export function TimesheetsStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [ready, setReady] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setExpenses(loadExpenses());
    setNow(Date.now());
  }, []);

  const memberName = useCallback((id: string) => loadTeamMembers().find((m) => m.id === id)?.name ?? "Employee", []);

  function decide(id: string, status: "approved" | "rejected") {
    decideExpense(id, status);
    refresh();
  }

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setReady(true);
    const interval = window.setInterval(refresh, 10000);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("atlas-user-shifts") || e.key.startsWith("atlas-user-team") || e.key.startsWith("atlas-expenses")) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const sheets = useMemo<{ member: TeamPerson; sheet: Timesheet }[]>(
    () => members.map((member) => ({ member, sheet: timesheetFor(member, undefined, now) })),
    [members, now],
  );

  const totals = useMemo(() => {
    return sheets.reduce(
      (acc, { sheet }) => ({
        today: acc.today + sheet.hoursToday,
        week: acc.week + sheet.hoursWeek,
        overtime: acc.overtime + sheet.overtime,
        late: acc.late + sheet.lateClockIns,
        missing: acc.missing + sheet.missingPunches,
      }),
      { today: 0, week: 0, overtime: 0, late: 0, missing: 0 },
    );
  }, [sheets]);

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Hours today</span>
          <strong>{totals.today.toFixed(1)}h</strong>
          <small>Team total</small>
        </div>
        <div className="stat">
          <span>Hours this week</span>
          <strong>{totals.week.toFixed(1)}h</strong>
          <small>Last 7 days</small>
        </div>
        <div className="stat">
          <span>Overtime</span>
          <strong>{totals.overtime.toFixed(1)}h</strong>
          <small>Over 40h/person</small>
        </div>
        <div className="stat">
          <span>Exceptions</span>
          <strong>{totals.late + totals.missing}</strong>
          <small>{totals.late} late · {totals.missing} missing</small>
        </div>
      </div>

      <section className="panel">
        <h2>Employee timesheets</h2>
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {ready && members.length === 0 ? (
          <p className="muted-line">No employees yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Today</th>
                  <th>This week</th>
                  <th>Overtime</th>
                  <th>Late</th>
                  <th>Missing</th>
                  <th>PTO</th>
                  <th>Sick</th>
                  <th>Now</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map(({ member, sheet }) => (
                  <tr key={member.id}>
                    <td>
                      <strong>{member.name}</strong>
                      <span className="muted-line" style={{ display: "block" }}>
                        {member.role}
                      </span>
                    </td>
                    <td>{sheet.hoursToday.toFixed(1)}h</td>
                    <td>{sheet.hoursWeek.toFixed(1)}h</td>
                    <td>{sheet.overtime > 0 ? `${sheet.overtime.toFixed(1)}h` : "—"}</td>
                    <td>{sheet.lateClockIns || "—"}</td>
                    <td>
                      {sheet.missingPunches ? (
                        <span className="badge warn">{sheet.missingPunches}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{sheet.ptoDays}d</td>
                    <td>{sheet.sickDays}d</td>
                    <td>
                      <span
                        className={
                          !sheet.clockedIn
                            ? "presence-badge offline"
                            : sheet.onBreak
                              ? "presence-badge break"
                              : "presence-badge working"
                        }
                      >
                        {!sheet.clockedIn ? "Clocked out" : sheet.onBreak ? "On break" : "Clocked in"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted-line" style={{ marginTop: "0.8rem" }}>
          Hours come from employee clock-ins on their own page. Overtime is time beyond 40h in the
          last 7 days; a missing punch is a past day left without a clock-out.
        </p>
      </section>

      <section className="panel">
        <h2>Expense approvals</h2>
        <p className="panel-lead">Receipts employees submitted from their Expense center.</p>
        {expenses.length === 0 ? (
          <p className="muted-line">No expenses submitted yet.</p>
        ) : (
          <div className="list">
            {expenses.map((x) => (
              <div className="list-row" key={x.id}>
                <span className={x.status === "approved" ? "badge ok" : x.status === "rejected" ? "badge warn" : "badge"}>${x.amount.toFixed(2)}</span>
                <div style={{ flex: 1 }}>
                  <p>
                    <strong>Expense Approval — ${x.amount.toFixed(2)}</strong>
                    <span className="muted-line">{memberName(x.memberId)} · {x.merchant} · {x.category}{x.project ? ` · ${x.project}` : ""} · {x.date}</span>
                  </p>
                </div>
                {x.status === "submitted" ? (
                  <div className="train-actions">
                    <button className="btn btn-dark" type="button" onClick={() => decide(x.id, "approved")}>Approve</button>
                    <button className="btn btn-outline" type="button" onClick={() => decide(x.id, "rejected")}>Reject</button>
                  </div>
                ) : (
                  <span className={x.status === "approved" ? "badge ok" : "badge warn"}>{x.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
