import Link from "next/link";
import { AtlasV1Home } from "@/components/AtlasV1Home";
import { CommandCenter } from "@/components/CommandCenter";
import { AppShell } from "@/components/AppShell";
import { activityFeed, dashboardMetrics } from "@/lib/data";
import { intelligenceScore } from "@/lib/atlas-platform";

export default function DashboardPage() {
  return (
    <AppShell
      title="Atlas"
      subtitle="First usable version — dashboard, calendar, tasks, conversations, files, and tax in one workspace."
      action={
        <div className="cta-row">
          <Link className="btn btn-outline" href="/app/tasks">
            Tasks
          </Link>
          <Link className="btn btn-dark" href="/app/appointments">
            Calendar
          </Link>
        </div>
      }
    >
      <AtlasV1Home />

      <CommandCenter />

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Intelligence Score</span>
          <strong>{intelligenceScore.score}</strong>
          <small>{intelligenceScore.change}</small>
        </div>
        {dashboardMetrics.slice(0, 7).map((stat) => (
          <div className="stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>

      <div className="split">
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

        <section className="panel">
          <h2>Jump into v1</h2>
          <div className="list">
            {[
              { href: "/app/appointments", label: "Smart Calendar", text: "Custom color categories + AI planner" },
              { href: "/app/tasks", label: "Tasks", text: "CallbackFlow, bills, and personal work" },
              { href: "/app/tax", label: "Tax ledger", text: "Income, expenses, and a basic estimate" },
              { href: "/app/account", label: "Profile & vault", text: "Settings, files, saved conversations" },
              { href: "/app/workflows", label: "Automation Builder", text: "Beyond v1 — no-code workflows" },
              { href: "/app/memory", label: "AI Memory", text: "Beyond v1 — long-term preferences" },
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
      </div>
    </AppShell>
  );
}
