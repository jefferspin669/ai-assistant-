import { CommandCenter } from "@/components/CommandCenter";
import { AppShell } from "@/components/AppShell";
import { activityFeed, dashboardMetrics, phases } from "@/lib/data";

export default function DashboardPage() {
  return (
    <AppShell
      title="Atlas"
      subtitle="The AI employee that can actually run a business — nothing else needs to be checked."
    >
      <CommandCenter />

      <div className="stat-grid metrics-dense">
        {dashboardMetrics.slice(0, 8).map((stat) => (
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
          <h2>Build in phases</h2>
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
