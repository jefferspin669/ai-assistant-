"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  approverForAmount,
  createApprovalRequest,
  createCustomRole,
  createEmergencyAccess,
  deptProfileFor,
  evaluateAction,
  formatLimit,
  formatTierRange,
  loadCustomRoles,
  loadTiers,
  locationsForMember,
  normalizeTiers,
  PERM_CATEGORIES,
  PERM_LEVELS,
  permissionsFor,
  removeCustomRole,
  setCategoryPerm,
  type ActionDecision,
  type ApprovalTier,
  type CustomRole,
  type PermLevel,
} from "@/lib/surface-workspace";
import {
  activeGrantsFor,
  grantTempAccess,
  loadTeamMembers,
  logAudit,
  seedDemoTeamIfEmpty,
  type TeamPerson,
} from "@/lib/user-workspace";

function grantExpiryDefault(): string {
  const d = new Date();
  d.setDate(d.getDate() + 4);
  d.setHours(17, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [simResult, setSimResult] = useState<{ decision?: ActionDecision; tier?: ApprovalTier | null; amount: number } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [tiers, setTiers] = useState<ApprovalTier[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [roleForm, setRoleForm] = useState({ name: "", region: "", expenseLimit: "", can: "", cannot: "" });
  const [grantResource, setGrantResource] = useState("Financial reports");
  const [grantExpiry, setGrantExpiry] = useState(grantExpiryDefault());
  const [breakResource, setBreakResource] = useState("Restricted customer records");
  const [breakReason, setBreakReason] = useState("");

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const list = loadTeamMembers();
    setMembers(list);
    setMemberId((prev) => prev || list[0]?.id || "");
    setTiers(loadTiers());
    setRoles(loadCustomRoles());
    setReady(true);
  }, []);

  const member = useMemo(() => members.find((m) => m.id === memberId) ?? null, [members, memberId]);
  const allLocations = useMemo(() => [...new Set(members.map((m) => m.location).filter(Boolean) as string[])], [members]);
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
      setSimResult({ tier: approverForAmount(amount, tiers), amount });
    } else {
      setSimResult({ decision: evaluateAction(member, simAction, amount), amount });
    }
  }

  function requestApproval(kind: string, title: string, amount: number, reason: string) {
    if (!member) return;
    createApprovalRequest({ kind, title, amount, requestedBy: member.name.split(" ")[0], reason, priority: amount >= 500 ? "urgent" : "normal" });
    setFlash("Sent to the manager's Approval Inbox for review.");
  }

  function setTierField(id: string, field: "max" | "approver", value: string) {
    const next = tiers.map((t) => (t.id === id ? { ...t, [field]: field === "max" ? (value === "" ? null : Number(value)) : value } : t));
    setTiers(normalizeTiers(next));
  }

  function addRole(e: FormEvent) {
    e.preventDefault();
    if (!roleForm.name.trim()) {
      setFlash("Enter a role name to create a custom role.");
      return;
    }
    createCustomRole({
      name: roleForm.name,
      region: roleForm.region,
      expenseLimit: Number(roleForm.expenseLimit) || 0,
      can: roleForm.can.split("\n").map((s) => s.trim()).filter(Boolean),
      cannot: roleForm.cannot.split("\n").map((s) => s.trim()).filter(Boolean),
    });
    setRoles(loadCustomRoles());
    setRoleForm({ name: "", region: "", expenseLimit: "", can: "", cannot: "" });
    setFlash("Custom role created.");
  }

  function deleteRole(id: string) {
    removeCustomRole(id);
    setRoles(loadCustomRoles());
  }

  function grantTemp(e: FormEvent) {
    e.preventDefault();
    if (!member || !grantResource.trim() || !grantExpiry) return;
    grantTempAccess({ memberId: member.id, memberName: member.name, resource: grantResource, grantedBy: "CEO", expiresAt: new Date(grantExpiry).toISOString() });
    setTick((n) => n + 1);
    setFlash(`Granted ${member.name.split(" ")[0]} temporary access to ${grantResource} (auto-expires).`);
  }

  function breakGlass(e: FormEvent) {
    e.preventDefault();
    if (!member || !breakReason.trim()) return;
    createEmergencyAccess({ who: member.name, resource: breakResource, reason: breakReason });
    logAudit(member.name, "EMERGENCY ACCESS (break glass)", `${breakResource} — ${breakReason}`);
    setBreakReason("");
    setFlash("🚨 Emergency access granted and recorded. Leadership has been notified.");
  }

  const simMeta = SIM_ACTIONS.find((a) => a.id === simAction)!;

  return (
    <div className="training-studio">
      {flash ? (
        <div className="memory-card"><div className="label">Atlas</div><p>{flash}</p></div>
      ) : null}

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
            simResult.tier !== undefined ? (
              <div className="memory-card" style={{ marginTop: "0.6rem" }}>
                <div className="label">Purchase of ${simResult.amount.toLocaleString()}</div>
                {simResult.tier && simResult.tier.approver.toLowerCase().includes("auto") ? (
                  <p>✅ {simResult.tier.approver} — {formatTierRange(simResult.tier)}.</p>
                ) : simResult.tier ? (
                  <>
                    <p>Atlas applies the hierarchy automatically:</p>
                    <p><strong>{formatTierRange(simResult.tier)} → {simResult.tier.approver}</strong></p>
                    <p className="muted-line">Routed to the right approver — no emailing around asking who signs off.</p>
                    <div className="train-actions" style={{ marginTop: "0.4rem" }}>
                      <button className="btn btn-dark" type="button" onClick={() => requestApproval("Purchase", `Purchase — $${simResult.amount.toLocaleString()}`, simResult.amount, "Purchase request")}>Send for {simResult.tier.approver}</button>
                    </div>
                  </>
                ) : null}
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
                    <button
                      className="btn btn-dark"
                      type="button"
                      onClick={() => requestApproval(simMeta.label, `${simMeta.label} — ${simMeta.unit === "percent" ? `${simResult.amount}%` : `$${simResult.amount.toLocaleString()}`}`, simResult.amount, "Exceeds automatic limit")}
                    >
                      Request Manager Approval
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null
          ) : null}
        </section>
      </div>

      <section className="panel">
        <h2>Conditional approval</h2>
        <p className="panel-lead">Set amount tiers — Atlas applies the hierarchy automatically.</p>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Range</th><th>Up to ($)</th><th>Approver</th></tr></thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.id}>
                  <td>{formatTierRange(t)}</td>
                  <td>{t.max === null ? <span className="muted-line">No cap</span> : <input type="number" min={0} value={t.max} onChange={(e) => setTierField(t.id, "max", e.target.value)} style={{ width: "8rem" }} aria-label={`${t.approver} threshold`} />}</td>
                  <td><input value={t.approver} onChange={(e) => setTierField(t.id, "approver", e.target.value)} aria-label={`${formatTierRange(t)} approver`} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(() => {
        const prof = deptProfileFor(member?.department);
        if (!prof) return null;
        return (
          <section className="panel">
            <h2>Department permissions — {prof.department}</h2>
            <p className="panel-lead">Baseline access from {member?.name.split(" ")[0]}&apos;s job (role-based access).</p>
            <div className="split">
              <div>
                <div className="label">✅ Can</div>
                <div className="list">{prof.can.map((c) => <div className="list-row" key={c}><span className="badge ok">✓</span><p>{c}</p></div>)}</div>
              </div>
              <div>
                <div className="label">🚫 Cannot</div>
                <div className="list">{prof.cannot.map((c) => <div className="list-row" key={c}><span className="badge warn">✗</span><p>{c}</p></div>)}</div>
              </div>
            </div>
          </section>
        );
      })()}

      {member ? (() => {
        const { allowed, blocked } = locationsForMember(member, allLocations);
        return (
          <section className="panel">
            <h2>Location-based access</h2>
            <p className="panel-lead">Employees see only their location; the CEO/owner sees everything.</p>
            <p>Can see: <strong>{allowed.length ? allowed.join(", ") : "—"}</strong></p>
            <p>Cannot see: <strong>{blocked.length ? blocked.join(", ") : "—"}</strong></p>
            {allLocations.length <= 1 ? <p className="muted-line">Add employees in other locations to see cross-location scoping.</p> : null}
          </section>
        );
      })() : null}

      <div className="split">
        <section className="panel">
          <h2>Temporary access</h2>
          <p className="panel-lead">Grant time-boxed access that auto-expires — great for projects or coverage.</p>
          <form onSubmit={grantTemp}>
            <div className="field-row">
              <label style={{ flex: 1 }}>Resource<input value={grantResource} onChange={(e) => setGrantResource(e.target.value)} /></label>
              <label>Until<input type="datetime-local" value={grantExpiry} onChange={(e) => setGrantExpiry(e.target.value)} /></label>
            </div>
            <button className="btn btn-dark" type="submit">Grant temporary access</button>
          </form>
          {member ? (() => {
            const active = activeGrantsFor(member.id);
            return active.length ? (
              <div className="list" style={{ marginTop: "0.6rem" }}>
                {active.map((g) => (
                  <div className="list-row" key={g.id}><span className="badge warn">⏳</span><p><strong>{g.resource}</strong><span className="muted-line">expires {new Date(g.expiresAt).toLocaleString()}</span></p></div>
                ))}
              </div>
            ) : <p className="muted-line" style={{ marginTop: "0.5rem" }}>No active temporary access for this employee.</p>;
          })() : null}
        </section>

        <section className="panel" style={{ borderLeft: "4px solid var(--rust, #b4532a)" }}>
          <h2>🚨 Emergency access (Break Glass)</h2>
          <p className="panel-lead">For emergencies only. Atlas records who, why, and when — and notifies leadership.</p>
          <form className="form-grid" onSubmit={breakGlass}>
            <label>Resource<input value={breakResource} onChange={(e) => setBreakResource(e.target.value)} /></label>
            <label>Reason (required)<textarea value={breakReason} onChange={(e) => setBreakReason(e.target.value)} rows={2} placeholder="e.g. Regional system outage requires access to restricted customer records" /></label>
            <button className="btn btn-dark" type="submit" disabled={!breakReason.trim()}>Request emergency access</button>
          </form>
        </section>
      </div>

      <section className="panel">
        <h2>Custom roles</h2>
        <p className="panel-lead">Create your own roles, like a Regional Manager.</p>
        <form className="form-grid" onSubmit={addRole}>
          <div className="field-row">
            <label>Role name<input value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="Regional Manager" /></label>
            <label>Region<input value={roleForm.region} onChange={(e) => setRoleForm({ ...roleForm, region: e.target.value })} placeholder="e.g. Midwest" /></label>
            <label>Expense approval limit ($)<input type="number" min={0} value={roleForm.expenseLimit} onChange={(e) => setRoleForm({ ...roleForm, expenseLimit: e.target.value })} placeholder="25000" /></label>
          </div>
          <div className="field-row">
            <label>Can (one per line)<textarea value={roleForm.can} onChange={(e) => setRoleForm({ ...roleForm, can: e.target.value })} rows={3} placeholder={"Full access to their region\nApprove expenses under $25K\nHire with HR approval"} /></label>
            <label>Cannot (one per line)<textarea value={roleForm.cannot} onChange={(e) => setRoleForm({ ...roleForm, cannot: e.target.value })} rows={3} placeholder={"Access other regions\nChange corporate policies"} /></label>
          </div>
          <button className="btn btn-dark" type="submit">Create role</button>
        </form>
        {roles.length ? (
          <div className="list" style={{ marginTop: "0.6rem" }}>
            {roles.map((r) => (
              <div className="list-row" key={r.id}>
                <span className="badge">Role</span>
                <div style={{ flex: 1 }}>
                  <p><strong>{r.name}</strong>{r.region ? ` · ${r.region}` : ""}{r.expenseLimit ? ` · expenses ≤ $${r.expenseLimit.toLocaleString()}` : ""}</p>
                  {r.can.length ? <p className="muted-line">✅ {r.can.join(", ")}</p> : null}
                  {r.cannot.length ? <p className="muted-line">🚫 {r.cannot.join(", ")}</p> : null}
                </div>
                <button className="btn btn-outline" type="button" onClick={() => deleteRole(r.id)}>Remove</button>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
