import { AppShell } from "@/components/AppShell";
import { insights } from "@/lib/data";

export default function InsightsPage() {
  return (
    <AppShell
      title="AI Insights"
      subtitle="Instead of just charts — advice you can act on today."
    >
      <div className="list">
        {insights.map((insight) => (
          <section className="panel insight" key={insight.title}>
            <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
              {insight.title}
            </strong>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.35rem" }}>{insight.body}</p>
          </section>
        ))}
      </div>

      <section className="panel">
        <h2>More recommendations</h2>
        <div className="list">
          <div className="list-row">
            <span className="badge warn">Action</span>
            <p>Add emergency service pricing to the chatbot — 18 visitors asked this week.</p>
          </div>
          <div className="list-row">
            <span className="badge">Tip</span>
            <p>Review requests sent within 2 hours convert 2.3× better than next-day sends.</p>
          </div>
          <div className="list-row">
            <span className="badge ok">Win</span>
            <p>Missed-call recovery brought in an estimated $6,400 this month.</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
