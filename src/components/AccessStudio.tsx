"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  grantTempAccess,
  isGrantActive,
  loadAudit,
  loadGrants,
  loadTeamMembers,
  revokeGrant,
  seedDemoTeamIfEmpty,
  type AuditEvent,
  type TeamPerson,
  type TempGrant,
} from "@/lib/user-workspace";

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(17, 0, 0, 0);
  // datetime-local wants YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AccessStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [grants, setGrants] = useState<TempGrant[]>([]);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [memberId, setMemberId] = useState("");
  const [resource, setResource] = useState("Johnson acquisition documents");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setGrants(loadGrants());
    setAudit(loadAudit());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setMemberId((prev) => prev || loadTeamMembers()[0]?.id || "");
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("atlas-temp-grants") || e.key.startsWith("atlas-audit")) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const activeCount = useMemo(() => grants.filter(isGrantActive).length, [grants]);

  function onGrant(e: FormEvent) {
    e.preventDefault();
    const member = members.find((m) => m.id === memberId);
    if (!member || !resource.trim() || !expiresAt) return;
    grantTempAccess({ memberId: member.id, memberName: member.name, resource, grantedBy: "Owner", expiresAt: new Date(expiresAt).toISOString() });
    setResource("");
    refresh();
  }

  function onRevoke(id: string) {
    revokeGrant(id);
    refresh();
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat"><span>Active grants</span><strong>{activeCount}</strong><small>Temporary access</small></div>
        <div className="stat"><span>Total grants</span><strong>{grants.length}</strong><small>All time</small></div>
        <div className="stat"><span>Audit events</span><strong>{audit.length}</strong><small>Recorded</small></div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Grant temporary access</h2>
          <p className="panel-lead">Access auto-expires at the time you set — no cleanup needed.</p>
          <form className="form-grid" onSubmit={onGrant}>
            <label>
              Employee
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} · {m.role}</option>
                ))}
              </select>
            </label>
            <label>
              Resource
              <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="Johnson acquisition documents" required />
            </label>
            <label>
              Access until
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
            </label>
            <button className="btn btn-dark" type="submit">Grant access</button>
          </form>

          <h3 style={{ marginTop: "1rem" }}>Current & past grants</h3>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && grants.length === 0 ? <p className="muted-line">No grants yet.</p> : null}
          <div className="list">
            {grants.map((g) => {
              const active = isGrantActive(g);
              return (
                <div className="list-row" key={g.id}>
                  <span className={active ? "badge ok" : "badge"}>{active ? "Active" : g.revoked ? "Revoked" : "Expired"}</span>
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{g.memberName} · {g.resource}</strong>
                      <span className="muted-line">By {g.grantedBy} · expires {new Date(g.expiresAt).toLocaleString()}</span>
                    </p>
                  </div>
                  {active ? <button className="btn btn-outline" type="button" onClick={() => onRevoke(g.id)}>Revoke</button> : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <h2>Audit trail</h2>
          <p className="panel-lead">Important actions are recorded with a timestamp.</p>
          {audit.length === 0 ? (
            <p className="muted-line">No audit events yet.</p>
          ) : (
            <div className="list">
              {audit.map((a) => (
                <div className="list-row" key={a.id}>
                  <span className="badge">🕓</span>
                  <p>
                    <strong>{a.actor} {a.action}</strong>
                    <span className="muted-line">{a.target} · {new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
