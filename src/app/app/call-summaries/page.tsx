import { FeatureView } from "@/components/FeatureView";
import { callSummaries } from "@/lib/atlas-platform";

export default function CallSummariesPage() {
  return (
    <FeatureView
      title="AI Call Summary"
      subtitle="Every phone call becomes a summary, action items, sentiment, mood, and notes — stored automatically."
      sections={[
        {
          type: "custom",
          node: (
            <div className="split" style={{ display: "grid", gap: "1rem" }}>
              {callSummaries.map((call) => (
                <section className="panel" key={call.when + call.caller}>
                  <h2>
                    {call.caller}{" "}
                    <span className="muted-line" style={{ display: "inline", marginLeft: "0.4rem" }}>
                      {call.when}
                    </span>
                  </h2>
                  <p className="panel-lead">{call.summary}</p>
                  <div className="list">
                    <div className="list-row">
                      <span className="badge">Sentiment</span>
                      <p>{call.sentiment}</p>
                    </div>
                    <div className="list-row">
                      <span className="badge">Mood</span>
                      <p>{call.mood}</p>
                    </div>
                    <div className="list-row">
                      <span className="badge ok">Notes</span>
                      <p>{call.notes}</p>
                    </div>
                  </div>
                  <h3 style={{ marginTop: "1rem" }}>Action items</h3>
                  <ul className="plain-list">
                    {call.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
