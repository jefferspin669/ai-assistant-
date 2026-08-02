"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { loadTasks, taskCounts } from "@/lib/tasks";
import { computeTaxEstimate, loadTaxTransactions, money } from "@/lib/tax-ledger";
import { vaultStatus } from "@/lib/secure-store";

const V1_SHIPPED = [
  { href: "/signup", label: "Registration & login", detail: "Signup, login, logout, password reset" },
  { href: "/app", label: "User dashboard", detail: "Command Center + Atlas v1 home" },
  { href: "/app/appointments", label: "Calendar + color categories", detail: "Smart Calendar with custom colors" },
  { href: "/app/tasks", label: "Tasks", detail: "To-do / doing / done board" },
  { href: "/app/account", label: "Saved AI conversations", detail: "Persisted from Talk to Atlas when signed in" },
  { href: "/app/account", label: "Profile & settings", detail: "Account Center profiles and preferences" },
  { href: "/app/account", label: "File uploads", detail: "Cloud vault + tax receipt attachments" },
  { href: "/app/tax", label: "Tax income & expenses", detail: "Ledger with durable local storage" },
  { href: "/app/tax", label: "Basic tax estimate", detail: "Recalculates from your ledger" },
  { href: "/app/security", label: "Secure database", detail: "Salted password hashes + isolated vault" },
];

const ROADMAP = [
  { href: "/app/account", label: "Organizations & team roles", status: "Live in Account Center" },
  { href: "/app/account", label: "Notifications", status: "Live in Account Center" },
  { href: "/app/account", label: "Stripe subscriptions", status: "Demo billing plans" },
  { href: "/app/appointments", label: "External calendar connections", status: "Connect panel on Smart Calendar" },
  { href: "/app/workflows", label: "Automation builder", status: "Live workflows studio" },
  { href: "/app/memory", label: "Advanced AI memory", status: "Memory + Account memories" },
];

export function AtlasV1Home() {
  const { account, ownerName, ready, logout } = useAccount();
  const [taskSummary, setTaskSummary] = useState({ open: 0, high: 0 });
  const [taxSummary, setTaxSummary] = useState({ owed: "$0", profit: "$0" });

  useEffect(() => {
    const tasks = loadTasks();
    const counts = taskCounts(tasks);
    setTaskSummary({ open: counts.todo + counts.doing, high: counts.high });
    const estimate = computeTaxEstimate(loadTaxTransactions());
    setTaxSummary({ owed: money(estimate.totalEstimated), profit: money(estimate.taxableProfit) });
  }, []);

  const vaultCopy = useMemo(() => {
    const base = vaultStatus(Boolean(account), account?.hasPassword ? "v1$x$y" : null);
    if (account?.hasPassword) {
      return {
        ...base,
        passwordHashed: true,
        detail: "Passwords are salted + hashed before storage. Session tokens stay device-local.",
      };
    }
    return base;
  }, [account]);

  if (!ready) return null;

  return (
    <div className="account-stack" style={{ marginBottom: "1rem" }}>
      <section className="panel sc-daily-plan">
        <p className="briefing-kicker">Atlas v1 · first usable version</p>
        <h2>
          {account ? `Welcome back, ${ownerName.split(" ")[0]}.` : "Your first working Atlas."}
        </h2>
        <p className="panel-lead">
          Registration, dashboard, calendar, tasks, saved chats, files, tax tracking, and a secure
          local vault — enough to run day one without every advanced module.
        </p>
        <div className="cta-row">
          {account ? (
            <>
              <Link className="btn btn-dark" href="/app/account">
                Profile & settings
              </Link>
              <button type="button" className="btn btn-outline" onClick={() => logout()}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-dark" href="/signup">
                Create account
              </Link>
              <Link className="btn btn-outline" href="/login">
                Log in
              </Link>
              <Link className="ghost-link" href="/forgot-password">
                Reset password
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Open tasks</span>
          <strong>{taskSummary.open}</strong>
          <small>{taskSummary.high} high priority</small>
        </div>
        <div className="stat">
          <span>Taxable profit</span>
          <strong>{taxSummary.profit}</strong>
          <small>From tax ledger</small>
        </div>
        <div className="stat">
          <span>Est. tax</span>
          <strong>{taxSummary.owed}</strong>
          <small>Basic estimate</small>
        </div>
        <div className="stat">
          <span>Vault</span>
          <strong>{vaultCopy.passwordHashed ? "Hashed" : "Legacy"}</strong>
          <small>{account ? "Signed in" : "Guest mode"}</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>v1 checklist · shipped</h2>
          <div className="list">
            {V1_SHIPPED.map((item) => (
              <div className="list-row" key={item.label}>
                <span className="badge ok">Live</span>
                <p>
                  <Link href={item.href}>
                    <strong>{item.label}</strong>
                  </Link>
                  <span className="muted-line">{item.detail}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Also on the platform</h2>
          <p className="panel-lead">Beyond v1 — already mocked for the fuller Atlas vision.</p>
          <div className="list">
            {ROADMAP.map((item) => (
              <div className="list-row" key={item.label}>
                <span className="badge">Next</span>
                <p>
                  <Link href={item.href}>
                    <strong>{item.label}</strong>
                  </Link>
                  <span className="muted-line">{item.status}</span>
                </p>
              </div>
            ))}
          </div>
          <div className="sc-insight" style={{ marginTop: "0.85rem" }}>
            <span>Secure database</span>
            <p>
              {vaultCopy.engine}. {vaultCopy.detail}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
