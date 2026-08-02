"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAccount } from "@/components/AccountProvider";
import { atlasApi } from "@/lib/api/atlas-api";

export function SettingsStudio() {
  const { account, ownerName, businessName, logout, ready } = useAccount();
  const [plan, setPlan] = useState("free");
  const [notes, setNotes] = useState(0);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const sub = atlasApi.billing.getSubscription();
    if (sub.ok && sub.data) setPlan(sub.data.plan);
    const n = atlasApi.notifications.list();
    if (n.ok) setNotes(n.data.filter((item) => !item.read).length);
  }, []);

  return (
    <AppShell
      title="Settings"
      subtitle="Profile, notifications, billing, and secure vault — Frontend Settings over Backend API."
    >
      {flash ? <p className="auth-success">{flash}</p> : null}

      <div className="split">
        <section className="panel">
          <h2>Profile</h2>
          <p className="panel-lead">
            {ready && account
              ? `${ownerName} · ${businessName}`
              : "Guest mode — register to sync Account Center with the database."}
          </p>
          <div className="cta-row">
            <Link className="btn btn-dark" href="/app/account">
              Open Account Center
            </Link>
            {account ? (
              <button type="button" className="btn btn-outline" onClick={() => logout()}>
                Log out
              </button>
            ) : (
              <Link className="btn btn-outline" href="/login">
                Log in
              </Link>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Notifications</h2>
          <p className="panel-lead">{notes} unread in the database.</p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              const list = atlasApi.notifications.list();
              if (!list.ok) return;
              list.data.filter((n) => !n.read).forEach((n) => atlasApi.notifications.markRead(n.id));
              setNotes(0);
              setFlash("Notifications marked read.");
            }}
          >
            Mark all read
          </button>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Billing</h2>
          <p className="panel-lead">Current plan: {plan}</p>
          <div className="cta-row">
            {(["free", "pro", "business", "enterprise"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={plan === item ? "btn btn-dark" : "btn btn-outline"}
                onClick={() => {
                  const result = atlasApi.billing.changePlan(item);
                  if (result.ok) {
                    setPlan(result.data.plan);
                    setFlash(`Plan set to ${result.data.plan}.`);
                  }
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Architecture</h2>
          <p className="panel-lead">Inspect Frontend · Backend API · Database wiring.</p>
          <Link className="btn btn-dark" href="/app/architecture">
            Open architecture map
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
