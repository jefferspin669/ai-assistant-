"use client";

import { useEffect, useMemo, useState } from "react";
import {
  evaluateAction,
  formatLimit,
  PERM_CATEGORIES,
  PERM_LEVELS,
  permissionsFor,
  purchaseChain,
  setCategoryPerm,
  type ActionDecision,
  type PermLevel,
} from "@/lib/surface-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty, type TeamPerson } from "@/lib/user-workspace";

const SIM_ACTIONS = [
  { id: "refund_customers", label: "Refund a customer", unit: "dollar" as const },
  { id: "issue_discounts", label: "Issue a discount", unit: "percent" as const },
  { id: "purchase", label: "Approve a purchase", unit: "dollar" as const },
];

export function ControlCenterStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [memberId, setMemberId] = useState("");
  const [tick, setTick] = useState(0);
  const [simAction, setSimAction] = useState("refund_customers");
  const [simAmount, setSimAmount] = useState("175");
  const [simResult, setSimResult] = useState<{ decision?: ActionDecision; chain?: string[]; amount: number } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const list = loadTeamMembers();
    setMembers(list);
    setMemberId((prev) => prev || list[0]?.id || "");
    setReady(true);
  }, []);

  const member = useMemo(() => members.find((m) => m.id === memberId) ?? null, [members, memberId]);
  // Recompute after each save (tick) even though permissionsFor reads storage.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const perms = useMemo(() => (member ? permissionsFor(member).categories : {}), [member, tick]);

  function changeLevel(categoryId: string, level: PermLevel) {
    if (!member) return;
    setCategoryPerm(member, categoryId, level);
    setTick((n) => n + 1);
  }
  function changeLimit(categoryId: string, limit: number, level: PermLevel) {
    if (!member) return;
    setCategoryPerm(member, categoryId, level, limit);
    setTick((n) => n + 1);
  }

  // Derived pre-approved rules for the selected employee.
  const rules = useMemo(() => {
    if (!member) return [] as string[];
    const first = member.name.split(" ")[0];
    const out: string[] = [];
    for (const cat of PERM_CATEGORIES) {
      const p = perms[cat.id];
      if (!p) continue;
      if (p.level === "auto" && cat.unit && p.limit !== undefined) {
        out.push(`${first} may automatically approve ${cat.label.toLowerCase()} up to ${formatLimit(cat, p.limit)}.`);
      } else if (p.level === "approval") {
        out.push(`${first} must request approval to ${cat.label.toLowerCase()}.`);
      }
    }
    return out;
  }, [member, perms]);

  function runSim() {
    if (!member) return;
    const amount = Number(simAmount) || 0;
    if (simAction === "purchase") {
      setSimResult({ chain: purchaseChain(amount), amount });
    } else {
      setSimResult({ decision: evaluateAction(member, simAction, amount), amount });
    }
  }

  const simMeta = SIM_ACTIONS.find((a) => a.id === simAction)!;

  return (
    <div className="training-studio">
      <section className="panel">
        <h2>Permission levels</h2>
        <p className="panel-lead">Permissions aren&apos;t just yes/no — pick the right level per category.</p>
        <div className="pack-grid">
          {PERM_LEVELS.map((l) => (
            <div key={l.id} className="pack-card">
              <strong>{l.label}</strong>
              <span className="muted-line">{l.blurb}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="train-head">
          <div>
            <h2>Employee permissions</h2>
            <p className="panel-lead">Select an employee and control access by category.</p>
          </div>
          <label style={{ maxWidth: "22rem" }}>
            Employee
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
            </select>
          </label>
        </div>
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {member ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Access level</th>
                  <th>Limit</th>
                </tr>
              </thead>
              <tbody>
                {PERM_CATEGORIES.map((cat) => {
                  const p = perms[cat.id] ?? { level: "none" as PermLevel };
                  const showLimit = Boolean(cat.unit) && (p.level === "auto" || p.level === "approval");
                  return (
                    <tr key={cat.id}>
                      <td><strong>{cat.label}</strong></td>
                      <td>
                        <select value={p.level} onChange={(e) => changeLevel(cat.id, e.target.value as PermLevel)} aria-label={`${cat.label} level`}>
                          {PERM_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                        </select>
                      </td>
                      <td>
                        {showLimit ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                            {cat.unit === "dollar" ? "$" : ""}
                            <input
                              type="number"
                              min={0}
                              value={p.limit ?? 0}
                              onChange={(e) => changeLimit(cat.id, Number(e.target.value), p.level)}
                              aria-label={`${cat.label} limit`}
                              style={{ width: "6rem" }}
                            />
                            {cat.unit === "percent" ? "%" : ""}
                          </span>
                        ) : (
                          <span className="muted-line">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="split">
        <section className="panel">
          <h2>Pre-approved rules</h2>
          <p className="panel-lead">Atlas enforces these automatically for {member?.name.split(" ")[0] ?? "this employee"}.</p>
          {rules.length === 0 ? (
            <p className="muted-line">No automatic-approval rules set for this employee.</p>
          ) : (
            <div className="list">
              {rules.map((r, i) => (
                <div className="list-row" key={i}><span className="badge ok">Rule</span><p>{r}</p></div>
              ))}
            </div>
          )}
          <div className="memory-card" style={{ marginTop: "0.6rem" }}>
            <div className="label">Company approval chain (purchases)</div>
            <p>Under $1,000 auto-approved · $1k+ Department Manager · $10k+ Finance Director · $50k+ CFO · $100k+ CEO.</p>
          </div>
        </section>

        <section className="panel">
          <h2>Request simulator</h2>
          <p className="panel-lead">See how Atlas would handle a request right now.</p>
          <div className="field-row">
            <label>
              Action
              <select value={simAction} onChange={(e) => { setSimAction(e.target.value); setSimResult(null); }}>
                {SIM_ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
              </select>
            </label>
            <label>
              Amount {simMeta.unit === "percent" ? "(%)" : "($)"}
              <input type="number" min={0} value={simAmount} onChange={(e) => setSimAmount(e.target.value)} />
            </label>
            <button className="btn btn-dark" type="button" onClick={runSim} style={{ alignSelf: "flex-end" }}>Check</button>
          </div>

          {simResult ? (
            simResult.chain !== undefined ? (
              <div className="memory-card" style={{ marginTop: "0.6rem" }}>
                <div className="label">Purchase of ${simResult.amount.toLocaleString()}</div>
                {simResult.chain.length === 0 ? (
                  <p>✅ Automatically approved — under the $1,000 threshold.</p>
                ) : (
                  <>
                    <p>Atlas routes this automatically through:</p>
                    <p><strong>Employee request → {simResult.chain.join(" → ")}</strong></p>
                    <p className="muted-line">Next approver: {simResult.chain[0]}. No need to email around asking who signs off.</p>
                  </>
                )}
              </div>
            ) : simResult.decision ? (
              <div className={`confirm-card`} style={{ marginTop: "0.6rem" }}>
                <div className="confirm-prompt">
                  {simResult.decision.outcome === "auto" ? "✅ Automatically Approved"
                    : simResult.decision.outcome === "allowed" ? "✅ Allowed"
                    : simResult.decision.outcome === "needs_approval" ? "⚠️ Approval Required"
                    : "⛔ Denied"}
                </div>
                <p>{simResult.decision.message}</p>
                {simResult.decision.outcome === "needs_approval" ? (
                  <div className="train-actions" style={{ marginTop: "0.4rem" }}>
                    <button className="btn btn-dark" type="button" onClick={() => setFlash("Request sent to your manager for approval.")}>Request Manager Approval</button>
                  </div>
                ) : null}
              </div>
            ) : null
          ) : null}
          {flash ? <p className="muted-line" style={{ marginTop: "0.6rem" }}>{flash}</p> : null}
        </section>
      </div>
    </div>
  );
}
