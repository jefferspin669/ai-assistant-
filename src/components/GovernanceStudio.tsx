"use client";

import { useMemo, useState } from "react";
import {
  governanceApprovals,
  governanceAuditLog,
  governanceReports,
  governanceRetention,
  governanceRoles,
} from "@/lib/atlas-platform";

type Mode = "approvals" | "audit" | "roles" | "retention" | "reports";

const modes: { id: Mode; label: string }[] = [
  { id: "approvals", label: "Approvals" },
  { id: "audit", label: "Audit log" },
  { id: "roles", label: "Permissions" },
  { id: "retention", label: "Data retention" },
  { id: "reports", label: "Compliance reports" },
];

export function GovernanceStudio() {
  const [mode, setMode] = useState<Mode>("approvals");
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string | null>(null);

  const pending = useMemo(
    () =>
      governanceApprovals.filter(
        (item) => (decisions[item.id] ?? item.status) === "Pending",
      ).length,
    [decisions],
  );

  function decide(id: string, status: "Approved" | "Rejected", label: string) {
    setDecisions((prev) => ({ ...prev, [id]: status }));
    setNote(`${status} “${label}”. Decision written to the audit log.`);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Pending approvals</span>
          <strong>{pending}</strong>
          <small>Human review required</small>
        </div>
        <div className="stat">
          <span>Audit events</span>
          <strong>{governanceAuditLog.length}</strong>
          <small>Recent trail</small>
        </div>
        <div className="stat">
          <span>Roles</span>
          <strong>{governanceRoles.length}</strong>
          <small>Role-based access</small>
        </div>
        <div className="stat">
          <span>Retention rules</span>
          <strong>{governanceRetention.length}</strong>
          <small>Data controls</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Trust and governance modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "approvals" ? (
        <section className="panel">
          <h2>Approval workflows</h2>
          <p className="panel-lead">
            Important and sensitive actions wait for human approval before Atlas executes.
          </p>
          <div className="list" style={{ marginTop: "0.85rem" }}>
            {governanceApprovals.map((item) => {
              const status = decisions[item.id] ?? item.status;
              return (
                <div className="list-row" key={item.id}>
                  <span className={`badge${status === "Approved" ? " ok" : status === "Pending" ? " warn" : ""}`}>
                    {status}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p>
                      <strong>{item.action}</strong>
                    </p>
                    <small className="muted-line">
                      {item.requester} · {item.risk} risk · {item.why}
                    </small>
                    {status === "Pending" ? (
                      <div className="cta-row" style={{ marginTop: "0.55rem" }}>
                        <button
                          className="btn btn-dark"
                          type="button"
                          onClick={() => decide(item.id, "Approved", item.action)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-outline"
                          type="button"
                          onClick={() => decide(item.id, "Rejected", item.action)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {note ? (
            <p className="muted-line" style={{ marginTop: "0.85rem" }}>
              {note}
            </p>
          ) : null}
        </section>
      ) : null}

      {mode === "audit" ? (
        <section className="panel">
          <h2>Audit log</h2>
          <p className="panel-lead">Every sensitive action, approval, and role change is retained.</p>
          <div className="list" style={{ marginTop: "0.85rem" }}>
            {governanceAuditLog.map((item) => (
              <div className="list-row" key={item.id}>
                <span className="badge">{item.time}</span>
                <div>
                  <p>
                    <strong>{item.event}</strong>
                  </p>
                  <small className="muted-line">
                    {item.actor} · {item.detail}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "roles" ? (
        <section className="panel">
          <h2>Role-based permissions</h2>
          <p className="panel-lead">Owners, managers, technicians, and AI agents each get a clear access set.</p>
          <div className="pack-grid dense" style={{ marginTop: "1rem" }}>
            {governanceRoles.map((item) => (
              <div className="domain-card" key={item.role}>
                <strong>{item.role}</strong>
                <span>{item.permissions.join(" · ")}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "retention" ? (
        <section className="panel">
          <h2>Data retention controls</h2>
          <p className="panel-lead">Set how long Atlas keeps recordings, chats, audiences, and audit history.</p>
          <table className="table" style={{ marginTop: "0.85rem" }}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Keep for</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {governanceRetention.map((item) => (
                <tr key={item.data}>
                  <td>
                    <strong>{item.data}</strong>
                  </td>
                  <td>{item.keep}</td>
                  <td>
                    <span className={`badge${item.status === "Locked" ? " ok" : ""}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {mode === "reports" ? (
        <section className="panel">
          <h2>Compliance reporting</h2>
          <p className="panel-lead">
            Enterprise-ready reports for access, human approvals, and retention — often what decides
            adoption.
          </p>
          <div className="list" style={{ marginTop: "0.85rem" }}>
            {governanceReports.map((item) => (
              <div className="list-row" key={item.id}>
                <span className="badge ok">{item.cadence}</span>
                <div>
                  <p>
                    <strong>{item.name}</strong>
                  </p>
                  <small className="muted-line">{item.audience}</small>
                </div>
                <button className="btn btn-outline" type="button">
                  Generate
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
