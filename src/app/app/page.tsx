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
          <Link className="btn btn-outline" href="/app/architecture">
            Architecture
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
              { href: "/app/appointments", label: "Calendar", text: "Frontend · color categories + AI planner" },
              { href: "/app/tax", label: "Tax Center", text: "Transactions + tax records" },
              { href: "/app/chat", label: "AI Chat", text: "Conversations table via AI API" },
              { href: "/app/files", label: "Files", text: "Documents uploads" },
              { href: "/app/settings", label: "Settings", text: "Profile, notifications, billing" },
              { href: "/app/architecture", label: "Architecture", text: "Frontend · Backend API · Database" },
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
