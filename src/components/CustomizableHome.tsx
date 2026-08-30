"use client";

import Link from "@/components/SiteLink";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AtlasV1Home } from "@/components/AtlasV1Home";
import { CommandCenter } from "@/components/CommandCenter";
import { DashboardCustomizer, useDashboardLayout } from "@/components/DashboardCustomizer";
import { useAccount } from "@/components/AccountProvider";
import { activityFeed, dashboardMetrics } from "@/lib/data";
import { intelligenceScore } from "@/lib/atlas-platform";
import { activeWidgets, type DashboardWidgetId } from "@/lib/dashboard-layout";
import { connectionStats, loadConnections } from "@/lib/connections";
import { pendingCount, loadConfirmations } from "@/lib/confirmations";
import { loadCalendarState } from "@/lib/smart-calendar";
import { loadCaptures } from "@/lib/quick-capture";
import { loadTasks, taskCounts } from "@/lib/tasks";
import { computeTaxEstimate, loadTaxTransactions, money } from "@/lib/tax-ledger";

function WidgetShell({
  size,
  children,
}: {
  size: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  return <div className={`dash-widget dash-widget-${size}`}>{children}</div>;
}

export function CustomizableHome() {
  const { layout, setLayout } = useDashboardLayout();
  const { account, ownerName, businessName, aiName, aiRole, ready } = useAccount();
  const [tick, setTick] = useState(0);
  const [taskSummary, setTaskSummary] = useState({ open: 0, high: 0 });
  const [taxSummary, setTaxSummary] = useState({ owed: "$0", profit: "$0", personal: "$0" });
  const [nextEvents, setNextEvents] = useState<{ id: string; title: string; start: string }[]>([]);
  const [recentNotes, setRecentNotes] = useState<{ id: string; title: string; kind: string }[]>([]);
  const [connSummary, setConnSummary] = useState({ connected: 0, total: 0, attention: 0 });
  const [pendingConfirms, setPendingConfirms] = useState(0);

  const refreshLive = useCallback(() => {
    const tasks = loadTasks();
    const counts = taskCounts(tasks);
    setTaskSummary({ open: counts.todo + counts.doing, high: counts.high });
    const estimate = computeTaxEstimate(loadTaxTransactions());
    setTaxSummary({
      owed: money(estimate.totalEstimated),
      profit: money(estimate.taxableProfit),
      personal: money(estimate.personalExpenses),
    });
    setNextEvents(
      [...loadCalendarState().events]
        .sort((a, b) => a.start.localeCompare(b.start))
        .filter((e) => new Date(e.start).getTime() >= Date.now() - 3600000)
        .slice(0, 4)
        .map((e) => ({ id: e.id, title: e.title, start: e.start })),
    );
    setRecentNotes(
      loadCaptures()
        .slice(0, 4)
        .map((n) => ({ id: n.id, title: n.title, kind: n.kind })),
    );
    setConnSummary(connectionStats(loadConnections()));
    setPendingConfirms(pendingCount(loadConfirmations()));
  }, []);

  useEffect(() => {
    refreshLive();
  }, [layout?.mode, tick, account?.id, ownerName, businessName, refreshLive]);

  useEffect(() => {
    function bump() {
      setTick((n) => n + 1);
    }
    function onStorage(e: StorageEvent) {
      if (!e.key || e.key.startsWith("atlas-")) bump();
    }
    window.addEventListener("focus", bump);
    window.addEventListener("visibilitychange", bump);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", bump);
      window.removeEventListener("visibilitychange", bump);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const widgets = useMemo(() => (layout ? activeWidgets(layout) : []), [layout]);
  const firstName = ownerName.split(" ")[0] || "there";

  if (!layout || !ready) return null;

  function renderWidget(id: DashboardWidgetId) {
    switch (id) {
      case "welcome":
      case "starter":
        return id === "welcome" ? <AtlasV1Home /> : null;
      case "stats":
        return (
          <section className="panel dash-profile-panel">
            <div className="dash-profile-hero">
              <div>
                <p className="briefing-kicker">Your dashboard</p>
                <h2>
                  {businessName}
                  <span className="dash-profile-owner"> · {firstName}</span>
                </h2>
                <p className="panel-lead">
                  {aiName} is your {aiRole}
                  {account?.email ? ` · ${account.email}` : account ? "" : " · Guest mode"}
                </p>
              </div>
              <Link className="btn btn-outline" href="/app/account">
                Edit profile
              </Link>
            </div>
            <div className="stat-grid metrics-dense">
              <div className="stat">
                <span>Intelligence Score</span>
                <strong>{intelligenceScore.score}</strong>
                <small>{intelligenceScore.change}</small>
              </div>
              <div className="stat">
                <span>Open tasks</span>
                <strong>{taskSummary.open}</strong>
                <small>{taskSummary.high} high priority</small>
              </div>
              <div className="stat">
                <span>Tax estimate</span>
                <strong>{taxSummary.owed}</strong>
                <small>Profit {taxSummary.profit}</small>
              </div>
              <div className="stat">
                <span>Connections</span>
                <strong>
                  {connSummary.connected}/{connSummary.total}
                </strong>
                <small>
                  {pendingConfirms} pending confirm{pendingConfirms === 1 ? "" : "s"}
                </small>
              </div>
              {dashboardMetrics.slice(0, 4).map((stat) => (
                <div className="stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  <small>{stat.detail}</small>
                </div>
              ))}
            </div>
          </section>
        );
      case "command":
        return <CommandCenter />;
      case "overnight":
        return (
          <section className="panel">
            <h2>Overnight</h2>
            <div className="list">
              {activityFeed.map((item) => (
                <div className="list-row" key={item.time + item.text}>
                  <span className="time">{item.time}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case "jump":
        return (
          <section className="panel">
            <h2>Jump into Atlas</h2>
            <div className="list">
              {[
                { href: "/app/confirmations", label: "Confirmations", text: "Approve risky actions" },
                { href: "/app/connections", label: "Connections", text: "Google, Stripe, banks…" },
                { href: "/app/contacts", label: "Contacts", text: "Customers to partners" },
                { href: "/app/notes", label: "Quick capture", text: "Notes before you forget" },
                { href: "/app/appointments", label: "Calendar", text: "Smart schedule" },
                { href: "/app/data", label: "Import & export", text: "Bring data with you" },
              ].map((item) => (
                <div className="list-row" key={item.href}>
                  <span className="badge ok">Open</span>
                  <p>
                    <Link href={item.href}>
                      <strong>{item.label}</strong>
                    </Link>
                    <span className="muted-line">{item.text}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        );
      case "tasks":
        return (
          <section className="panel">
            <h2>Open tasks</h2>
            <p className="panel-lead">
              {taskSummary.open} open · {taskSummary.high} high priority
            </p>
            <Link className="btn btn-outline" href="/app/tasks">
              Open task board
            </Link>
          </section>
        );
      case "tax":
        return (
          <section className="panel">
            <h2>Tax snapshot</h2>
            <p className="panel-lead">
              Profit {taxSummary.profit} · estimated tax {taxSummary.owed}
              {taxSummary.personal !== "$0" ? ` · personal spend ${taxSummary.personal}` : ""}
            </p>
            <Link className="btn btn-outline" href="/app/tax">
              Open Tax Center
            </Link>
          </section>
        );
      case "calendar":
        return (
          <section className="panel">
            <h2>Next appointments</h2>
            <ul className="manage-list">
              {nextEvents.length ? (
                nextEvents.map((event) => (
                  <li key={event.id}>
                    <div>
                      <strong>{event.title}</strong>
                      <span>{new Date(event.start).toLocaleString()}</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="muted">No upcoming events.</li>
              )}
            </ul>
            <Link className="btn btn-outline" href="/app/appointments">
              Open calendar
            </Link>
          </section>
        );
      case "notes":
        return (
          <section className="panel">
            <h2>Recent notes</h2>
            <ul className="manage-list">
              {recentNotes.length ? (
                recentNotes.map((note) => (
                  <li key={note.id}>
                    <div>
                      <strong>{note.title}</strong>
                      <span>{note.kind}</span>
                    </div>
                  </li>
                ))
              ) : (
                <li className="muted">No captures yet.</li>
              )}
            </ul>
            <Link className="btn btn-outline" href="/app/notes">
              Quick capture
            </Link>
          </section>
        );
      default:
        return null;
    }
  }

  const showHome = widgets.some((w) => w.id === "welcome" || w.id === "starter");
  const rest = widgets.filter((w) => w.id !== "welcome" && w.id !== "starter");

  const rows: DashboardWidgetId[][] = [];
  for (let i = 0; i < rest.length; i++) {
    const current = rest[i];
    const next = rest[i + 1];
    if (
      next &&
      (current.size === "md" || current.size === "sm") &&
      (next.size === "md" || next.size === "sm")
    ) {
      rows.push([current.id, next.id]);
      i += 1;
    } else {
      rows.push([current.id]);
    }
  }

  return (
    <>
      <DashboardCustomizer layout={layout} onChange={setLayout} />
      {showHome ? <AtlasV1Home refreshKey={tick} /> : null}
      {rows.map((row) =>
        row.length === 2 ? (
          <div className="split" key={row.join("-")}>
            {row.map((id) => {
              const widget = rest.find((w) => w.id === id)!;
              return (
                <WidgetShell key={id} size={widget.size}>
                  {renderWidget(id)}
                </WidgetShell>
              );
            })}
          </div>
        ) : (
          <WidgetShell key={row[0]} size={rest.find((w) => w.id === row[0])?.size || "lg"}>
            {renderWidget(row[0])}
          </WidgetShell>
        ),
      )}
    </>
  );
}
