"use client";

import Link from "@/components/SiteLink";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { AtlasChatPanel } from "@/components/AtlasChatPanel";
import {
  applyOwnerEffect,
  loadDashboardSnapshot,
  type DashboardSnapshot,
  type OwnerEffectId,
} from "@/lib/dashboard";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function DataBadge({ source }: { source: DashboardSnapshot["kpis"][number]["source"] }) {
  return <span className={`data-badge data-badge-${source === "CONNECTED DATA" ? "connected" : source.toLowerCase()}`}>{source}</span>;
}

export function CommandDashboard() {
  const { account, ownerName, ready, logout } = useAccount();
  const greeting = useMemo(() => timeGreeting(), []);
  const firstName = ownerName.split(" ")[0];
  const [snap, setSnap] = useState<DashboardSnapshot | null>(null);
  const [note, setNote] = useState("");

  function refresh() {
    setSnap(loadDashboardSnapshot());
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!ready || !snap) return null;

  function runFinding(effect?: OwnerEffectId) {
    if (!effect) return;
    const result = applyOwnerEffect(effect);
    setNote(result.note);
    refresh();
  }

  return (
    <div className="command-dashboard">
      <header className="dash-top-bar">
        <div className="dash-top-bar-spacer" />
        {account ? (
          <button type="button" className="dash-logout" onClick={() => logout()}>
            Log out
          </button>
        ) : (
          <Link href="/login" className="btn btn-outline dash-login">
            Log in
          </Link>
        )}
      </header>

      <section className="dash-hero">
        <p className="briefing-kicker">Here is your business today</p>
        <h2>
          {greeting}, {firstName}.
        </h2>
        <p className="dash-hero-sub">
          Numbers with a DEMO badge are sample or workspace-seeded data — not a connected bank, phone, or ads account.
        </p>
      </section>

      <div className="stat-grid dash-kpi-row">
        {snap.kpis.map((kpi) => (
          <Link className="stat dash-kpi" href={kpi.href} key={kpi.id}>
            <span>
              {kpi.label} <DataBadge source={kpi.source} />
            </span>
            <strong>{kpi.value}</strong>
            <small>{kpi.detail}</small>
          </Link>
        ))}
      </div>

      {note ? <p className="auth-success">{note}</p> : null}

      <section className="panel">
        <h2>Atlas found</h2>
        <p className="panel-lead">Suggestions stay suggestions until you approve them.</p>
        <div className="finding-list">
          {snap.findings.map((item) => (
            <article className="finding-card" key={item.id}>
              <div className="finding-head">
                <span aria-hidden="true">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <span className="muted-line">{item.detail}</span>
                </div>
                <span className={`badge stance-${item.stance.toLowerCase()}`}>{item.stance}</span>
                <DataBadge source={item.source} />
              </div>
              <div className="cta-row">
                {item.stance === "APPROVE" ? (
                  <Link className="btn btn-dark" href="/app/ask">
                    {item.actionLabel}
                  </Link>
                ) : item.effect ? (
                  <button className="btn btn-dark" type="button" onClick={() => runFinding(item.effect)}>
                    {item.actionLabel}
                  </button>
                ) : (
                  <Link className="btn btn-dark" href={item.href}>
                    {item.actionLabel}
                  </Link>
                )}
                <Link className="btn btn-outline" href={item.href}>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="split dash-briefing-row">
        <section className="panel">
          <h2>
            Approvals{" "}
            {snap.pendingApprovals ? <span className="badge warn">{snap.pendingApprovals}</span> : null}
          </h2>
          <p className="panel-lead">Owners should not hunt through modules for yes/no decisions.</p>
          {snap.approvals.length ? (
            <div className="list">
              {snap.approvals.slice(0, 4).map((item) => (
                <div className="list-row" key={item.id}>
                  <span className="badge warn">Needs you</span>
                  <p>
                    <Link href="/app/approvals">
                      <strong>{item.title}</strong>
                    </Link>
                    <span className="muted-line">{item.summary}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-line">Nothing waiting. Risky actions will land here.</p>
          )}
          <div className="cta-row" style={{ marginTop: "0.85rem" }}>
            <Link className="btn btn-outline" href="/app/approvals">
              Open inbox
            </Link>
          </div>
        </section>

        <section className="panel">
          <h2>Atlas activity</h2>
          <p className="panel-lead">What ran — labeled so demo work never looks live.</p>
          <ol className="activity-timeline">
            {snap.activity.map((item) => (
              <li key={item.id} className={`activity-item activity-${item.tone}`}>
                <span className="activity-time">{item.timeLabel}</span>
                <span>{item.title}</span>
                <DataBadge source={item.source} />
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="panel dash-ask">
        <h2>Ask Atlas</h2>
        <p className="panel-lead">Try “How did we do this week?” then “What should I do?”</p>
        <AtlasChatPanel compact />
      </section>
    </div>
  );
}
