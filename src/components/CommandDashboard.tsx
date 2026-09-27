"use client";

import Link from "@/components/SiteLink";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { DashboardAskAtlas } from "@/components/DashboardAskAtlas";
import { DashboardCustomizer, useDashboardLayout } from "@/components/DashboardCustomizer";
import { apiGet } from "@/lib/backend/client";
import type { DashboardSnapshot, Provenance } from "@/lib/dashboard";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const EMPTY_DASHBOARD: DashboardSnapshot = {
  kpis: [
    { id: "customers", label: "Customers", value: "—", detail: "Connect your workspace", href: "/app/customers", source: "NOT CONNECTED" },
    { id: "tasks", label: "Open tasks", value: "—", detail: "Connect your workspace", href: "/app/tasks", source: "NOT CONNECTED" },
    { id: "calendar", label: "Today", value: "—", detail: "Connect your calendar", href: "/app/appointments", source: "NOT CONNECTED" },
    { id: "revenue", label: "Recorded income", value: "—", detail: "Connect a financial source", href: "/app/money", source: "NOT CONNECTED" },
  ],
  findings: [],
  activity: [],
  approvals: [],
  pendingApprovals: 0,
  briefing: "",
  recommend: "",
};

function cleanSource(source: Provenance): Provenance {
  return source === "DEMO" ? "NOT CONNECTED" : source;
}

function normalizeDashboard(payload: Partial<DashboardSnapshot>): DashboardSnapshot {
  return {
    ...EMPTY_DASHBOARD,
    ...payload,
    kpis: (payload.kpis?.length ? payload.kpis : EMPTY_DASHBOARD.kpis).map((item) =>
      item.source === "DEMO"
        ? { ...item, value: "—", detail: "Connect this data source", source: "NOT CONNECTED" as const }
        : { ...item, source: cleanSource(item.source) },
    ),
    findings: (payload.findings || []).filter((item) => item.source !== "DEMO"),
    activity: (payload.activity || [])
      .filter((item) => item.source !== "DEMO")
      .map((item) => ({ ...item, tone: item.tone || "neutral", source: cleanSource(item.source) })),
    approvals: payload.approvals || [],
    pendingApprovals: payload.pendingApprovals || 0,
  };
}

function DataBadge({ source }: { source: Provenance }) {
  const className = source.toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={`data-badge data-badge-${className}`}>
      {source === "NOT CONNECTED" ? "SETUP" : source}
    </span>
  );
}

export function CommandDashboard() {
  const { ownerName, ready } = useAccount();
  const { layout, setLayout, editMode, setEditMode } = useDashboardLayout();
  const greeting = useMemo(() => timeGreeting(), []);
  const firstName = ownerName.split(" ")[0] || "there";
  const [snap, setSnap] = useState<DashboardSnapshot>(EMPTY_DASHBOARD);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void apiGet<Partial<DashboardSnapshot>>("/api/dashboard").then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setSnap(normalizeDashboard(result.data));
        setConnected(true);
      } else {
        setSnap(EMPTY_DASHBOARD);
        setConnected(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  const attentionCount = snap.findings.length + snap.pendingApprovals;

  return (
    <div className="command-dashboard">
      {layout && editMode ? (
        <DashboardCustomizer
          layout={layout}
          onChange={setLayout}
          editMode={editMode}
          onEditModeChange={setEditMode}
        />
      ) : null}

      <section className="dash-overview-hero">
        <div>
          <p className="briefing-kicker">Business overview</p>
          <h2>{greeting}, {firstName}.</h2>
          <p>See what needs attention, then get back to running the business.</p>
        </div>
        <div className="dash-hero-actions">
          <Link className="btn btn-dark" href="/app/ask">Ask Atlas</Link>
          <Link className="btn btn-outline" href="/app/appointments">Open calendar</Link>
          {layout ? (
            <button type="button" className="btn btn-outline" onClick={() => setEditMode(true)}>
              Customize
            </button>
          ) : null}
        </div>
      </section>

      {!connected ? (
        <section className="dashboard-connection-notice">
          <div>
            <strong>Connect Atlas to see live business data</strong>
            <span>This preview no longer fills the dashboard with sample customers, money, or tasks.</span>
          </div>
          <Link className="btn btn-dark" href="/app/setup">Finish setup</Link>
        </section>
      ) : null}

      <div className="stat-grid dash-kpi-row">
        {snap.kpis.slice(0, 4).map((kpi) => (
          <Link className="stat dash-kpi" href={kpi.href} key={kpi.id}>
            <span>{kpi.label} <DataBadge source={kpi.source} /></span>
            <strong>{kpi.value}</strong>
            <small>{kpi.detail}</small>
          </Link>
        ))}
      </div>

      <div className="dash-focus-grid">
        <section className="panel">
          <div className="dashboard-section-heading">
            <div>
              <p className="briefing-kicker">Focus</p>
              <h2>Needs your attention</h2>
            </div>
            <span className={attentionCount ? "badge warn" : "badge ok"}>{attentionCount}</span>
          </div>

          {snap.approvals.slice(0, 3).map((item) => (
            <Link className="dashboard-attention-row" href="/app/approvals" key={item.id}>
              <span className="dashboard-attention-icon">!</span>
              <span><strong>{item.title}</strong><small>{item.summary}</small></span>
              <span>Review</span>
            </Link>
          ))}

          {snap.findings.slice(0, 4).map((item) => (
            <Link className="dashboard-attention-row" href={item.href} key={item.id}>
              <span className="dashboard-attention-icon" aria-hidden="true">{item.icon}</span>
              <span><strong>{item.title}</strong><small>{item.detail}</small></span>
              <span>{item.actionLabel}</span>
            </Link>
          ))}

          {attentionCount === 0 ? (
            <div className="dashboard-all-clear">
              <span aria-hidden="true">✓</span>
              <div><strong>Nothing urgent</strong><p>Approvals, overdue work, and important alerts will appear here.</p></div>
            </div>
          ) : null}
        </section>

        <section className="panel dashboard-quick-actions">
          <p className="briefing-kicker">Shortcuts</p>
          <h2>Keep work moving</h2>
          <div className="dashboard-shortcut-grid">
            <Link href="/app/projects"><strong>Projects</strong><span>Plan and assign work</span></Link>
            <Link href="/app/tasks"><strong>Tasks</strong><span>Track today’s work</span></Link>
            <Link href="/app/customers"><strong>Customers</strong><span>Open the customer list</span></Link>
            <Link href="/app/approvals"><strong>Approvals</strong><span>Review protected actions</span></Link>
          </div>
        </section>
      </div>

      <DashboardAskAtlas />

      {snap.activity.length ? (
        <section className="panel dashboard-recent-activity">
          <div className="dashboard-section-heading">
            <div><p className="briefing-kicker">Audit trail</p><h2>Recent activity</h2></div>
            <Link href="/app/security-center?mode=audit">View all</Link>
          </div>
          <ol className="activity-timeline">
            {snap.activity.slice(0, 5).map((item) => (
              <li key={item.id} className={`activity-item activity-${item.tone}`}>
                <span className="activity-time">{item.timeLabel}</span>
                <span>{item.title}</span>
                <DataBadge source={item.source} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
