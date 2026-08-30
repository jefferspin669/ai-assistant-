"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { AtlasChatDrawer } from "@/components/AtlasChatDrawer";
import { PerformanceChart } from "@/components/PerformanceChart";
import {
  atlasBriefingItems,
  attentionItems,
  dashboardOverview,
  formatMoneyFull,
} from "@/lib/data";
import { loadTasks, taskCounts } from "@/lib/tasks";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function CommandDashboard() {
  const { account, ownerName, ready, logout } = useAccount();
  const greeting = useMemo(() => timeGreeting(), []);
  const firstName = ownerName.split(" ")[0];
  const [openTasks, setOpenTasks] = useState(dashboardOverview.openTasks);

  useEffect(() => {
    const tasks = loadTasks();
    const counts = taskCounts(tasks);
    setOpenTasks(counts.todo + counts.doing);
  }, []);

  if (!ready) return null;

  const overview = dashboardOverview;

  return (
    <div className="command-dashboard">
      <header className="dash-top-bar">
        <div className="dash-top-bar-spacer" />
        {account ? (
          <button type="button" className="ghost-link dash-logout" onClick={() => logout()}>
            Log out
          </button>
        ) : (
          <Link href="/login" className="ghost-link dash-logout">
            Log in
          </Link>
        )}
      </header>

      <section className="dash-hero">
        <p className="briefing-kicker">Morning overview</p>
        <h2>
          {greeting}, {firstName}.
        </h2>
        <p className="dash-hero-lead">
          Your business made <strong>{formatMoneyFull(overview.yesterdayRevenue)}</strong> yesterday.
        </p>
        <p className="dash-hero-sub">
          Revenue is up <strong>{overview.weekChangePct}%</strong> from last week.
        </p>
      </section>

      <div className="stat-grid dash-kpi-row">
        <div className="stat">
          <span>Revenue</span>
          <strong>{formatMoneyFull(overview.revenue)}</strong>
        </div>
        <div className="stat">
          <span>Profit</span>
          <strong>{formatMoneyFull(overview.profit)}</strong>
        </div>
        <div className="stat">
          <span>Expenses</span>
          <strong>{formatMoneyFull(overview.expenses)}</strong>
        </div>
        <div className="stat">
          <span>Open tasks</span>
          <strong>{openTasks}</strong>
        </div>
      </div>

      <PerformanceChart />

      <div className="split dash-briefing-row">
        <section className="panel">
          <h2>Atlas Briefing</h2>
          <p className="panel-lead">What happened while you were away.</p>
          <ul className="dash-bullet-list">
            {atlasBriefingItems.map((item) => (
              <li key={item.text} className={`dash-bullet dash-bullet-${item.tone}`}>
                {item.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Needs Your Attention</h2>
          <p className="panel-lead">Decisions and approvals waiting on you.</p>
          <div className="list">
            {attentionItems.map((item) => (
              <div className="list-row" key={item.title}>
                <span className={`badge${item.priority === "high" ? " warn" : ""}`}>
                  {item.priority === "high" ? "High" : "Today"}
                </span>
                <p>
                  <Link href={item.href}>
                    <strong>{item.title}</strong>
                  </Link>
                  <span className="muted-line">{item.detail}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <AtlasChatDrawer />
    </div>
  );
}
