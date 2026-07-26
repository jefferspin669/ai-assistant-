import { AppShell } from "@/components/AppShell";

const bars = [
  { label: "Revenue", value: "$28.4k", width: "88%" },
  { label: "Leads", value: "146", width: "74%" },
  { label: "Missed calls", value: "31", width: "42%" },
  { label: "Conversion", value: "37%", width: "61%" },
  { label: "Avg response", value: "46s", width: "80%" },
  { label: "Busy hours", value: "12–2 PM", width: "69%" },
  { label: "Repeat customers", value: "41%", width: "55%" },
  { label: "Best employee", value: "Alex", width: "92%" },
];

export default function AnalyticsPage() {
  return (
    <AppShell title="Analytics" subtitle="Charts for the numbers that decide whether you hire — or automate.">
      <section className="panel">
        <h2>This month</h2>
        <div className="bars">
          {bars.map((bar) => (
            <div className="bar-row" key={bar.label}>
              <span>{bar.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: bar.width }} />
              </div>
              <strong>{bar.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
