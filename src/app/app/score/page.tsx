import { FeatureView } from "@/components/FeatureView";
import { intelligenceScore } from "@/lib/atlas-platform";

export default function ScorePage() {
  const { score, change, pillars, why, next } = intelligenceScore;
  return (
    <FeatureView
      title="Atlas Intelligence Score"
      subtitle="A business health score from 0–100 — Atlas explains why it moved and what to fix first."
      sections={[
        {
          type: "custom",
          node: (
            <section className="panel">
              <div className="score-hero">
                <div className="score-ring" style={{ ["--score" as string]: score }}>
                  {score}
                </div>
                <div>
                  <h2 style={{ marginBottom: "0.35rem" }}>Summit Home Services</h2>
                  <p className="panel-lead" style={{ marginBottom: "0.45rem" }}>
                    {change}
                  </p>
                  <p>{why}</p>
                  <p style={{ marginTop: "0.55rem" }}>
                    <strong>Next:</strong> {next}
                  </p>
                </div>
              </div>
            </section>
          ),
        },
        {
          type: "custom",
          node: (
            <section className="panel">
              <h2>Pillars</h2>
              <div className="pillar-bars">
                {pillars.map((pillar) => (
                  <div className="pillar-bar" key={pillar.name}>
                    <span>{pillar.name}</span>
                    <div className="track">
                      <div className="fill" style={{ width: `${pillar.value}%` }} />
                    </div>
                    <strong>{pillar.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          ),
        },
      ]}
    />
  );
}
