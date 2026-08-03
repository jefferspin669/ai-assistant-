"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { loadStarterDashboard, type StarterDashboard } from "@/lib/setup";
import { loadTasks, taskCounts } from "@/lib/tasks";
import { computeTaxEstimate, loadTaxTransactions, money } from "@/lib/tax-ledger";
import { vaultStatus } from "@/lib/secure-store";

const V1_SHIPPED = [
  { href: "/app/privacy", label: "Privacy center", detail: "Memory, sharing, export, deletion" },
  { href: "/app/accessibility", label: "Accessibility", detail: "Large text, contrast, calendar labels" },
  { href: "/app/testing", label: "Testing system", detail: "Login, tax, backup, security suites" },
  { href: "/app/flags", label: "Feature flags", detail: "Beta calendar, tax calc, new dashboard" },
  { href: "/app/feedback", label: "Feedback", detail: "Helpful / incorrect / undo Atlas" },
  { href: "/app/sync", label: "Status & sync", detail: "Saved · Saving · Synced · Offline…" },
  { href: "/app/offline", label: "Offline support", detail: "Calendar, tasks, notes while offline" },
  { href: "/app/admin", label: "Admin panel", detail: "Accounts, billing, health, suspend/restore" },
  { href: "/app/support", label: "Support center", detail: "Help, tickets, friendly errors" },
  { href: "/app/confirmations", label: "Confirmations", detail: "Risky actions wait for approval" },
];

const ROADMAP = [
  { href: "/app/account", label: "Organizations & team roles", status: "Live in Account Center" },
  { href: "/app/account", label: "Notifications", status: "Live in Account Center" },
  { href: "/app/account", label: "Stripe subscriptions", status: "Demo billing plans" },
  { href: "/app/appointments", label: "External calendar connections", status: "Connect panel on Smart Calendar" },
  { href: "/app/workflows", label: "Automation builder", status: "Live workflows studio" },
  { href: "/app/memory", label: "Advanced AI memory", status: "Memory + Account memories" },
];

export function AtlasV1Home({ refreshKey = 0 }: { refreshKey?: number }) {
  const { account, ownerName, businessName, ready, logout } = useAccount();
  const [taskSummary, setTaskSummary] = useState({ open: 0, high: 0 });
  const [taxSummary, setTaxSummary] = useState({ owed: "$0", profit: "$0" });
  const [starter, setStarter] = useState<StarterDashboard | null>(null);

  useEffect(() => {
    const tasks = loadTasks();
    const counts = taskCounts(tasks);
    setTaskSummary({ open: counts.todo + counts.doing, high: counts.high });
    const estimate = computeTaxEstimate(loadTaxTransactions());
    setTaxSummary({ owed: money(estimate.totalEstimated), profit: money(estimate.taxableProfit) });
    setStarter(loadStarterDashboard(account?.id));
  }, [account?.id, refreshKey, ownerName, businessName]);

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
      <section className="panel sc-daily-plan dash-welcome-hero">
        <p className="briefing-kicker">
          {starter ? "Starter dashboard · built from setup" : "Atlas v1 · first usable version"}
        </p>
        <h2>
          {account ? `Welcome back, ${ownerName.split(" ")[0]}.` : "Your first working Atlas."}
        </h2>
        <p className="panel-lead dash-welcome-biz">
          {account ? (
            <>
              <strong>{businessName}</strong>
              {" — "}
              {starter
                ? `${starter.accountType === "business" ? "Business" : "Personal"} workspace focused on ${starter.goals.slice(0, 2).join(" · ") || "your day-one goals"}.`
                : "Registration, setup, global search, import/export, undo/recovery, calendar, tasks, chats, files, and tax — enough to run day one."}
            </>
          ) : (
            "Registration, setup, global search, import/export, undo/recovery, calendar, tasks, chats, files, and tax — enough to run day one."
          )}
        </p>
        <div className="cta-row">
          {account ? (
            <>
              {!account.setup?.completed ? (
                <Link className="btn btn-dark" href="/app/setup">
                  Finish setup
                </Link>
              ) : (
                <Link className="btn btn-dark" href="/app/appointments">
                  Open calendar
                </Link>
              )}
              <Link className="btn btn-outline" href="/app/data">
                Import & export
              </Link>
              <Link className="btn btn-outline" href="/app/recovery">
                Undo & recovery
              </Link>
              <button type="button" className="ghost-link" onClick={() => logout()}>
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

      {starter?.widgets?.length ? (
        <section className="panel">
          <h2>Your starter dashboard</h2>
          <p className="panel-lead">Generated automatically when you finished first-time setup.</p>
          <div className="starter-grid">
            {starter.widgets.map((widget) => (
              <Link key={widget.id} href={widget.href} className="starter-card">
                <strong>{widget.title}</strong>
                <span>{widget.detail}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
