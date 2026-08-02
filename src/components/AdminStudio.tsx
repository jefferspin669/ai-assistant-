"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  loadAdminSnapshot,
  restoreAccount,
  restoreUserData,
  suspendAccount,
  type AdminSnapshot,
} from "@/lib/admin";

export function AdminStudio() {
  const [snap, setSnap] = useState<AdminSnapshot | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSnap(loadAdminSnapshot());
  }, []);

  if (!snap) return null;

  return (
    <AppShell
      title="Admin control panel"
      subtitle="Internal owner dashboard — accounts, subscriptions, payments, usage, errors, support, and system health."
    >
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Active subscriptions</span>
          <strong>{snap.metrics.activeSubscriptions}</strong>
          <small>MRR ${snap.metrics.mrr}</small>
        </div>
        <div className="stat">
          <span>Storage usage</span>
          <strong>{snap.metrics.storageGb} GB</strong>
          <small>Across all accounts</small>
        </div>
        <div className="stat">
          <span>AI usage (24h)</span>
          <strong>{snap.metrics.aiRequests24h}</strong>
          <small>Requests</small>
        </div>
        <div className="stat">
          <span>Error rate</span>
          <strong>{snap.metrics.errorRate}%</strong>
          <small>Needs attention if rising</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>User accounts</h2>
          <ul className="manage-list">
            {snap.users.map((user) => (
              <li key={user.id}>
                <div>
                  <strong>
                    {user.name} · {user.plan}
                  </strong>
                  <span>
                    {user.email} · {user.status} · {user.storageMb} MB · {user.aiRequests} AI req
                  </span>
                </div>
                <div className="cta-row">
                  {user.status === "suspended" ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setSnap(restoreAccount(user.id));
                        setMessage(`Restored ${user.email}.`);
                      }}
                    >
                      Restore account
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setSnap(suspendAccount(user.id));
                        setMessage(`Suspended ${user.email}.`);
                      }}
                    >
                      Suspend
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      const result = restoreUserData(user.id);
                      setSnap(result.snapshot);
                      setMessage(result.message);
                    }}
                  >
                    Restore data
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Failed payments</h2>
          <ul className="manage-list">
            {snap.failedPayments.map((pay) => (
              <li key={pay.id}>
                <div>
                  <strong>
                    ${pay.amount} · {pay.email}
                  </strong>
                  <span>
                    {pay.reason} · {new Date(pay.at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: "1.25rem" }}>Support requests</h2>
          <ul className="manage-list">
            {snap.supportRequests.map((req) => (
              <li key={req.id}>
                <div>
                  <strong>
                    [{req.priority}] {req.subject}
                  </strong>
                  <span>
                    {req.userEmail} · {req.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Suspicious activity</h2>
          <ul className="manage-list">
            {snap.suspicious.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>
                    [{item.severity}] {item.title}
                  </strong>
                  <span>
                    {item.detail} · {new Date(item.at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>System health</h2>
          <ul className="manage-list">
            {snap.systemHealth.map((item) => (
              <li key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </div>
                <span className={`badge ${item.status === "ok" ? "ok" : "warn"}`}>{item.status}</span>
              </li>
            ))}
          </ul>

          <h2 style={{ marginTop: "1.25rem" }}>Recent errors</h2>
          <ul className="manage-list">
            {snap.errors.map((err) => (
              <li key={err.id}>
                <div>
                  <strong>{err.code}</strong>
                  <span>
                    {err.technical} · {new Date(err.at).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
