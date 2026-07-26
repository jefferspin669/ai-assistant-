import { CommandCenter } from "@/components/CommandCenter";
import { AppShell } from "@/components/AppShell";
import { activityFeed, todayStats } from "@/lib/data";

export default function DashboardPage() {
  return (
    <AppShell
      title="Command Center"
      subtitle="Understand. Recommend. Act — with your permission when it matters."
    >
      <CommandCenter />

      <div className="stat-grid">
        {todayStats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>While you were away</h2>
        <div className="list">
          {activityFeed.map((item) => (
            <div className="list-row" key={item.time + item.text}>
              <span className="time">{item.time}</span>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
