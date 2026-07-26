import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { activityFeed, insights, todayStats } from "@/lib/data";

export default function DashboardPage() {
  return (
    <AppShell
      title="Today’s Activity"
      subtitle="One screen with everything happening across your AI Employee."
      action={
        <Link className="btn btn-dark" href="/app/missed-calls">
          Review missed calls
        </Link>
      }
    >
      <div className="stat-grid">
        {todayStats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>

      <div className="split">
        <section className="panel">
          <h2>Live feed</h2>
          <div className="list">
            {activityFeed.map((item) => (
              <div className="list-row" key={item.time + item.text}>
                <span className="time">{item.time}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>AI Insights</h2>
          <div className="list">
            {insights.map((insight) => (
              <div className="insight" key={insight.title}>
                <strong>{insight.title}</strong>
                <p style={{ color: "var(--ink-soft)" }}>{insight.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
