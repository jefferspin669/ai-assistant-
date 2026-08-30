"use client";

import Link from "@/components/SiteLink";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { AtlasChatPanel } from "@/components/AtlasChatPanel";
import { AutonomyControl } from "@/components/AtlasStatus";
import { useAtlasRuntime } from "@/components/AtlasRuntimeProvider";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AWAY_POLICY, AWAY_REPORT } from "@/lib/atlas-runtime";
import {
  applyOwnerEffect,
  loadDashboardSnapshot,
  type DashboardSnapshot,
  type OwnerEffectId,
  type Severity,
} from "@/lib/dashboard";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  attention: "Attention",
  opportunity: "Opportunity",
  handled: "Handled",
};

export function CommandDashboard() {
  const { ownerName, ready } = useAccount();
  const { runtime, leave, comeBack, dismissReport } = useAtlasRuntime();
  const greeting = useMemo(() => timeGreeting(), []);
  const firstName = ownerName.split(" ")[0] || "there";
  const [snap, setSnap] = useState<DashboardSnapshot | null>(null);
  const [note, setNote] = useState("");
  const [briefingOpen, setBriefingOpen] = useState(true);

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

  const status = runtime.paused ? "Paused" : runtime.away ? "Running" : "Live";

  return (
    <div className="command-dashboard command-dashboard-os">
      {runtime.away ? (
        <section className="panel away-banner" aria-live="polite">
          <p className="briefing-kicker">Atlas is running the business</p>
          <h2>You&apos;re away. Atlas has the routine.</h2>
          <ul className="away-grid">
            {AWAY_POLICY.automatic.map((item) => (
              <li key={item}>
                <strong>✓</strong> {item} — automatic
              </li>
            ))}
          </ul>
          <p>
            Spending limit ${AWAY_POLICY.spendLimit} · refund limit ${AWAY_POLICY.refundLimit}
          </p>
          <p className="muted-line">Contact you for: {AWAY_POLICY.contactFor.join(" · ")}</p>
          <button type="button" className="btn btn-dark" onClick={comeBack}>
            I&apos;m back
          </button>
        </section>
      ) : null}

      {!runtime.away && !runtime.awayReportDismissed ? (
        <section className="panel away-report" aria-live="polite">
          <p className="briefing-kicker">While you were away</p>
          <h2>Atlas kept the company moving.</h2>
          <ul className="away-grid">
            {AWAY_REPORT.map((row) => (
              <li key={row.label}>
                <strong>{row.value}</strong> {row.label}
              </li>
            ))}
          </ul>
          <div className="cta-row">
            <Link className="btn btn-dark" href="/app/approvals">
              Review the decision
            </Link>
            <button type="button" className="btn btn-outline" onClick={dismissReport}>
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

      <section className="dash-hero dash-hero-os">
        <div className="dash-hero-copy">
          <p className="briefing-kicker">
            {greeting}, {firstName}
            <span className={`atlas-live-tag${runtime.paused ? " is-paused" : ""}`}>
              Atlas · {status}
            </span>
          </p>
          <h2>{snap.headline}</h2>
          <p className="dash-hero-sub">DEMO figures until a bank is connected. Atlas still tells you what changed.</p>
        </div>
        <div className="dash-hero-actions">
          {!runtime.away ? (
            <button type="button" className="btn btn-dark" onClick={leave}>
              I&apos;m leaving — run the business
            </button>
          ) : null}
          <button type="button" className="btn btn-outline" onClick={() => setBriefingOpen((open) => !open)}>
            {briefingOpen ? "Hide morning briefing" : "Morning briefing"}
          </button>
        </div>
      </section>

      {briefingOpen ? (
        <section className="panel morning-briefing">
          <h2>Morning briefing</h2>
          {snap.morningBriefing.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <Link className="btn btn-dark" href="/app/approvals">
            Review decisions
          </Link>
        </section>
      ) : null}

      <div className="stat-grid dash-kpi-row dash-money-row">
        {snap.money.map((kpi) => (
          <Link className="stat dash-kpi" href={kpi.href} key={kpi.id}>
            <span>{kpi.label}</span>
            <strong>{kpi.value}</strong>
            <small className={`kpi-delta kpi-delta-${kpi.direction}`}>
              {kpi.direction === "up" ? "↑" : kpi.direction === "down" ? "↓" : ""} {kpi.delta}
              {kpi.direction !== "flat" ? " vs previous period" : ""}
            </small>
          </Link>
        ))}
      </div>

      {note ? <p className="auth-success">{note}</p> : null}

      <div className="split dash-briefing-row">
        <PerformanceChart />
        <section className="panel">
          <h2>
            Needs you{" "}
            {snap.pendingApprovals ? <span className="badge warn">{snap.pendingApprovals}</span> : null}
          </h2>
          <p className="panel-lead">These wait on the owner — not another module hunt.</p>
          <div className="list">
            {snap.needsYou.map((item) => (
              <div className="list-row" key={item.title}>
                <span className="badge warn">Needs you</span>
                <p>
                  <Link href={item.href}>
                    <strong>{item.title}</strong>
                  </Link>
                </p>
              </div>
            ))}
          </div>
          <div className="cta-row" style={{ marginTop: "0.85rem" }}>
            <Link className="btn btn-outline" href="/app/approvals">
              Open inbox
            </Link>
          </div>
        </section>
      </div>

      <div className="split dash-briefing-row">
        <section className="panel">
          <h2>Atlas briefing</h2>
          <ul className="severity-list">
            {snap.findings.slice(0, 4).map((item) => (
              <li key={item.id} className={`severity-item severity-${item.severity}`}>
                <span className="severity-mark" aria-hidden="true" />
                <div>
                  <strong>
                    {SEVERITY_LABEL[item.severity]} · {item.title}
                  </strong>
                  <span className="muted-line">{item.detail}</span>
                  {item.effect && item.open ? (
                    <button className="ghost-link" type="button" onClick={() => runFinding(item.effect)}>
                      {item.actionLabel}
                    </button>
                  ) : (
                    <Link className="ghost-link" href={item.href}>
                      Open
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <ul className="dash-bullet-list" style={{ marginTop: "0.85rem" }}>
            {snap.briefingBullets.map((item) => (
              <li key={item.text} className={`dash-bullet dash-bullet-${item.tone}`}>
                {item.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Atlas activity</h2>
          <p className="panel-lead">What Atlas already handled.</p>
          <ul className="dash-bullet-list">
            {snap.handled.map((item) => (
              <li key={item} className="dash-bullet dash-bullet-ok">
                ✓ {item}
              </li>
            ))}
          </ul>
          <ol className="activity-timeline" style={{ marginTop: "0.85rem" }}>
            {snap.activity.slice(0, 4).map((item) => (
              <li key={item.id} className={`activity-item activity-${item.tone}`}>
                <span className="activity-time">{item.timeLabel}</span>
                <span>{item.title}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <AutonomyControl />

      <section className="panel dash-ask">
        <h2>Ask Atlas</h2>
        <p className="panel-lead">Or press Ctrl+K to find anything.</p>
        <AtlasChatPanel compact />
      </section>
    </div>
  );
}
