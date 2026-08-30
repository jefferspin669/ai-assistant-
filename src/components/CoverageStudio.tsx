"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  coveragePlan,
  loadTeamMembers,
  seedDemoTeamIfEmpty,
  type CoveragePlan,
  type TeamPerson,
} from "@/lib/user-workspace";

export function CoverageStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [memberId, setMemberId] = useState("");
  const [plan, setPlan] = useState<CoveragePlan | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => setMembers(loadTeamMembers()), []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setMemberId((prev) => prev || loadTeamMembers()[0]?.id || "");
    setReady(true);
  }, [refresh]);

  const activeMember = useMemo(() => members.find((m) => m.id === memberId) ?? null, [members, memberId]);

  function runPlan() {
    if (!activeMember) return;
    setPlan(coveragePlan(activeMember));
  }

  return (
    <div className="training-studio">
      <section className="panel">
        <h2>Who&apos;s unavailable?</h2>
        <p className="panel-lead">Pick someone who called off and Atlas shows what needs coverage.</p>
        <div className="field-row">
          <label style={{ flex: 1 }}>
            Employee
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name} · {m.role}</option>
              ))}
            </select>
          </label>
          <button className="btn btn-dark" type="button" onClick={runPlan} style={{ alignSelf: "flex-end" }}>Plan coverage</button>
        </div>
        {!ready ? <p className="muted-line">Loading…</p> : null}
      </section>

      {plan ? (
        <>
          <div className="stat-grid metrics-dense">
            <div className="stat"><span>Tasks affected</span><strong>{plan.tasksAffected}</strong><small>Open work</small></div>
            <div className="stat"><span>Appointments</span><strong>{plan.appointmentsAffected}</strong><small>Customer visits</small></div>
            <div className="stat"><span>Urgent deadlines</span><strong>{plan.urgentDeadlines}</strong><small>Due today</small></div>
          </div>

          <section className="panel">
            <h2>{plan.member.name} is unavailable — coverage plan</h2>
            {plan.items.length === 0 ? (
              <p className="muted-line">Nothing open needs coverage right now.</p>
            ) : (
              <div className="list">
                {plan.items.map((item, i) => (
                  <div className="list-row" key={i} style={{ alignItems: "flex-start" }}>
                    <span className={item.kind === "deadline" ? "badge warn" : item.kind === "appointment" ? "badge" : "badge"}>
                      {item.kind === "deadline" ? "⏰" : item.kind === "appointment" ? "📅" : "✅"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p><strong>{item.title}</strong><span className="muted-line">{item.detail}</span></p>
                      <p className="muted-line" style={{ marginTop: "0.2rem" }}>
                        {item.suggestions.length
                          ? `Suggested: ${item.suggestions.map((s) => `${s.name} (${s.reason})`).join(", ")}`
                          : "No available teammate found — may need to reschedule."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
