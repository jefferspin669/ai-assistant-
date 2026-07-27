import { FeatureView } from "@/components/FeatureView";
import { customers } from "@/lib/data";
import { crmPredictions } from "@/lib/atlas-platform";
import { timelineEvents } from "@/lib/data";

export default function CustomersPage() {
  return (
    <FeatureView
      title="AI CRM"
      subtitle="Instead of just storing names — Atlas predicts who needs attention and what to say."
      sections={[
        {
          type: "table",
          title: "Customers",
          headers: ["Name", "Jobs", "Value", "Last activity"],
          rows: customers.map((c) => [c.name, String(c.jobs), c.value, c.last]),
        },
        {
          type: "custom",
          node: (
            <section className="panel">
              <h2>Predictive outreach</h2>
              <div className="list">
                {crmPredictions.map((item) => (
                  <div className="list-row" key={item.customer}>
                    <span className="badge warn">Signal</span>
                    <div>
                      <p>
                        <strong>{item.customer}</strong> — {item.signal}
                      </p>
                      <small className="muted-line">{item.action}</small>
                      <div className="memory-card" style={{ marginTop: "0.55rem" }}>
                        <p>{item.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ),
        },
        {
          type: "panel",
          title: "Timeline snapshot · Elena",
          list: timelineEvents.slice(0, 3).map((event) => ({
            badge: event.channel,
            text: event.text,
            sub: event.when,
          })),
        },
      ]}
    />
  );
}
