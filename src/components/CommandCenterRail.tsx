"use client";

import Link from "@/components/SiteLink";
import {
  loadCommandActivity,
  loadCommandDataSources,
  loadSuggestedActions,
  loadTodayAttention,
  type CommandAlert,
} from "@/lib/command-center";

export function CommandCenterRail() {
  const attention = loadTodayAttention();
  const activity = loadCommandActivity();
  const sources = loadCommandDataSources();
  const actions = loadSuggestedActions();

  return (
    <aside className="command-center-rail">
      <section className="panel">
        <h3>Current alerts</h3>
        {attention.alerts.length ? (
          <div className="list">
            {attention.alerts.map((a: CommandAlert) => (
              <Link key={a.id} href={a.href} className="compliance-row">
                <span className={a.severity === "high" ? "badge warn" : "badge"}>{a.title}</span>
                <small className="muted-line">{a.detail}</small>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted-line">No open alerts.</p>
        )}
      </section>

      <section className="panel">
        <h3>Recent activity</h3>
        <ol className="plain-list">
          {activity.slice(0, 5).map((a) => (
            <li key={a.id}><small>{a.timeLabel}</small> — {a.title}</li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h3>Data sources</h3>
        <ul className="plain-list">
          {sources.map((s) => (
            <li key={s.id}>
              <strong>{s.label}</strong>
              <span className={`data-badge data-badge-${s.status === "live" ? "connected" : s.status}`}>
                {s.status}
              </span>
              <br />
              <small className="muted-line">{s.detail}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h3>Quick actions</h3>
        <div className="cta-row">
          {actions.map((a) => (
            <Link key={a.id} className="btn btn-outline" href={a.href}>{a.label}</Link>
          ))}
        </div>
      </section>
    </aside>
  );
}
