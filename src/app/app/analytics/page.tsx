import { AppShell } from "@/components/AppShell";
import { dashboardMetrics } from "@/lib/data";

export default function AnalyticsPage() {
  return (
    <AppShell title="Business Dashboard" subtitle="Animated. Modern. Beautiful — and connected to Atlas.">
      <div className="stat-grid metrics-dense">
        {dashboardMetrics.map((stat) => (
          <div className="stat pulse-stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
