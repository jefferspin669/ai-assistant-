import Link from "next/link";
import { CommandCenter } from "@/components/CommandCenter";
import { AppShell } from "@/components/AppShell";
import { activityFeed, dashboardMetrics, phases } from "@/lib/data";
import { intelligenceScore } from "@/lib/atlas-platform";

export default function DashboardPage() {
  return (
    <AppShell
      title="Atlas"
      subtitle="Don’t ask how — tell Atlas what to do. Atlas Actions runs the outcome across every device."
      action={
        <Link className="btn btn-dark" href="/app/actions">
          Open Atlas Actions
        </Link>
      }
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
              { href: "/app/actions", label: "Atlas Actions", text: "Say the outcome — invoice, email, remind, books" },
              { href: "/app/executive", label: "Executive Dashboard", text: "Schedule, tasks, emails, bills, cash, weather" },
              { href: "/app/mission-control", label: "Mission Control", text: "CEO command bridge — already briefed" },
              { href: "/app/marketplace", label: "AI Agent Marketplace", text: "Install Sales, HR, Marketing, and more" },
              { href: "/app/workflows", label: "Automation Builder", text: "No-code if-this-then-that for the business" },
              { href: "/app/knowledge", label: "Knowledge Brain", text: "Ask your manuals, policies, and emails" },
              { href: "/app/finance", label: "Financial Command", text: "Cash, budgets, invoices, payroll, tax plan" },
              { href: "/app/voice", label: "Voice Everywhere", text: "Same conversation on every device" },
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
