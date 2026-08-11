"use client";

import { useEffect, useMemo, useState } from "react";
import {
  contactsPermFor,
  locationsForMember,
  permissionsFor,
  PERM_LEVELS,
  seesAllLocations,
  type PermLevel,
} from "@/lib/surface-workspace";
import {
  activeGrantsFor,
  loadTeamMembers,
  scopesFor,
  seedDemoTeamIfEmpty,
  type TeamPerson,
} from "@/lib/user-workspace";

type AreaAccess = { area: string; access: string; visible: boolean; sensitive: boolean; note?: string };

const levelLabel = (l: PermLevel) => PERM_LEVELS.find((x) => x.id === l)?.label ?? l;

export function PermissionSimulatorStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [memberId, setMemberId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const list = loadTeamMembers();
    setMembers(list);
    setMemberId((prev) => prev || list[0]?.id || "");
    setReady(true);
  }, []);

  const member = useMemo(() => members.find((m) => m.id === memberId) ?? null, [members, memberId]);
  const allLocations = useMemo(() => [...new Set(members.map((m) => m.location).filter(Boolean) as string[])], [members]);

  const preview = useMemo<AreaAccess[]>(() => {
    if (!member) return [];
    const cats = permissionsFor(member).categories;
    const contacts = contactsPermFor(member);
    const scopes = scopesFor(member);
    const grants = activeGrantsFor(member.id).map((g) => g.resource.toLowerCase());
    const grantCovers = (kw: string) => grants.some((r) => r.includes(kw));
    const lvl = (id: string): PermLevel => cats[id]?.level ?? "none";
    const areaFromLevel = (id: string, label: string, sensitive = false, note?: string): AreaAccess => {
      const l = lvl(id);
      return { area: label, access: l === "none" ? "No access" : levelLabel(l), visible: l !== "none", sensitive, note };
    };

    return [
      { area: "My dashboard & tasks", access: "Full", visible: true, sensitive: false },
      { area: "Customers (CRM)", access: contacts.view ? `${contacts.view ? "View" : ""}${contacts.add ? " · Add" : ""}${contacts.edit ? " · Edit" : ""}${contacts.export ? " · Export" : ""}${contacts.delete ? " · Delete" : ""}`.trim() : "No access", visible: contacts.view, sensitive: contacts.export || contacts.delete, note: contacts.export || contacts.delete ? "Can export/delete customer records" : undefined },
      areaFromLevel("view_pricing", "Pricing"),
      areaFromLevel("create_invoices", "Invoices & billing"),
      areaFromLevel("assign_tasks", "Assign tasks"),
      { area: "Employee performance", access: lvl("view_performance") === "none" ? "No access" : `${levelLabel(lvl("view_performance"))} (team only)`, visible: lvl("view_performance") !== "none", sensitive: false },
      areaFromLevel("view_payroll", "Payroll", true),
      { area: "Financial reports", access: scopes.includes("financial") || scopes.includes("company") || grantCovers("financial") ? (grantCovers("financial") && !scopes.includes("financial") ? "Temporary access" : "Full") : "No access", visible: scopes.includes("financial") || scopes.includes("company") || grantCovers("financial"), sensitive: true },
      { area: "HR / personnel files", access: scopes.includes("personnel") || scopes.includes("company") ? "Full" : "No access", visible: scopes.includes("personnel") || scopes.includes("company"), sensitive: true },
      { area: "Confidential projects", access: scopes.includes("company") || (member.department === "Management") || grantCovers("acquisition") || grantCovers("confidential") ? "Visible" : "No access", visible: scopes.includes("company") || member.department === "Management" || grantCovers("acquisition") || grantCovers("confidential"), sensitive: true },
      areaFromLevel("edit_settings", "Company settings", true),
    ];
  }, [member]);

  const sensitiveExposed = preview.filter((a) => a.sensitive && a.visible);
  const loc = member ? locationsForMember(member, allLocations) : { allowed: [], blocked: [] };

  return (
    <div className="training-studio">
      <section className="panel">
        <div className="train-head">
          <div>
            <h2>Preview access</h2>
            <p className="panel-lead">Pick an employee, then see their view exactly as they would — before you change anything.</p>
          </div>
          <label style={{ maxWidth: "24rem" }}>
            Preview as
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
            </select>
          </label>
        </div>
        {!ready ? <p className="muted-line">Loading…</p> : null}
      </section>

      {member ? (
        <>
          {sensitiveExposed.length ? (
            <section className="panel" style={{ borderLeft: "4px solid var(--rust, #b4532a)", background: "rgba(180, 83, 42, 0.06)" }}>
              <h2>⚠️ Heads up before you grant access</h2>
              <p className="panel-lead">{member.name.split(" ")[0]} would be able to see sensitive areas:</p>
              <div className="status-picker">
                {sensitiveExposed.map((a) => <span key={a.area} className="badge warn">{a.area}</span>)}
              </div>
            </section>
          ) : (
            <section className="panel" style={{ borderLeft: "4px solid var(--teal)" }}>
              <h2>✅ No sensitive exposure</h2>
              <p className="panel-lead">{member.name.split(" ")[0]} has no access to payroll, financials, HR files, confidential projects, or company settings.</p>
            </section>
          )}

          <section className="panel">
            <h2>Atlas — as {member.name}</h2>
            <p className="panel-lead">This is what {member.name.split(" ")[0]} sees when they sign in.</p>
            <div className="list">
              {preview.map((a) => (
                <div className="list-row" key={a.area}>
                  <span className={a.visible ? (a.sensitive ? "badge warn" : "badge ok") : "badge"}>{a.visible ? (a.sensitive ? "⚠️" : "✅") : "🔒"}</span>
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{a.area}</strong>
                      <span className="muted-line">{a.visible ? a.access : "Hidden — no access"}{a.note ? ` · ${a.note}` : ""}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Location scope</h2>
            {seesAllLocations(member) ? (
              <p>Sees <strong>all locations</strong> (leadership).</p>
            ) : (
              <>
                <p>Can see: <strong>{loc.allowed.length ? loc.allowed.join(", ") : "—"}</strong></p>
                <p>Cannot see: <strong>{loc.blocked.length ? loc.blocked.join(", ") : "—"}</strong></p>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
