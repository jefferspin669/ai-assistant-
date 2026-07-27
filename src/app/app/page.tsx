import Link from "next/link";
import { CommandCenter } from "@/components/CommandCenter";
import { AppShell } from "@/components/AppShell";
import { activityFeed, dashboardMetrics, phases } from "@/lib/data";
import { intelligenceScore } from "@/lib/atlas-platform";

export default function DashboardPage() {
  return (
    <AppShell
      title="Atlas"
      subtitle="The central AI that remembers your business — talk to it, or open Atlas Brain."
    >
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
          <h2>Atlas platform</h2>
          <div className="list">
            {[
              { href: "/app/brain", label: "Atlas Brain", text: "The memory of the whole business" },
              { href: "/app/decisions", label: "Decision Engine", text: "Eight lenses before every major call" },
              { href: "/app/executive-timeline", label: "Executive Timeline", text: "Everything important on one spine" },
              { href: "/app/ceo-memory", label: "CEO Memory", text: "Ask why — months later, Atlas still knows" },
              { href: "/app/board", label: "Board Advisor", text: "Balanced AI expert debate on decisions" },
              { href: "/app/phone", label: "Phone System", text: "Answers, routes, books, pays" },
              { href: "/app/score", label: "Intelligence Score", text: "Health from 0–100 with next actions" },
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
          <h3 style={{ marginTop: "1rem" }}>Build in phases</h3>
          <div className="phase-list">
            {phases.map((phase) => (
              <div className="phase-item" key={phase.phase}>
                <span>{phase.phase}</span>
                <strong>{phase.title}</strong>
                <p>{phase.items.join(" · ")}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
