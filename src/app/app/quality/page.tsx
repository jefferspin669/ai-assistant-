import { FeatureView } from "@/components/FeatureView";
import { qualitySignals } from "@/lib/atlas-platform";

export default function QualityPage() {
  return (
    <FeatureView
      title="AI Quality Control"
      subtitle="Reads customer feedback, detects patterns, and alerts the owner before reputation slips."
      sections={[
        {
          type: "panel",
          title: "Patterns this week",
          list: qualitySignals.map((signal) => ({
            badge: `${signal.count}×`,
            badgeTone: signal.severity === "Positive" ? ("ok" as const) : ("warn" as const),
            text: signal.pattern,
            sub: signal.ownerAlert
              ? `${signal.severity} · owner alerted`
              : `${signal.severity} · monitoring`,
          })),
        },
        {
          type: "chat",
          title: "Owner alert",
          bubbles: [
            {
              role: "ai",
              text: "Five customers mentioned “long wait.” I opened a Quality alert and drafted a response plan: tighten ETA texts and protect morning buffers.",
            },
          ],
        },
      ]}
    />
  );
}
