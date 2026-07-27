import { FeatureView } from "@/components/FeatureView";
import { insights } from "@/lib/data";
import { predictiveAlerts } from "@/lib/atlas-platform";

export default function InsightsPage() {
  return (
    <FeatureView
      title="Predictive Analytics"
      subtitle="Atlas notices patterns early — seasonal dips, shortages, and quality trends — and warns months ahead."
      sections={[
        {
          type: "panel",
          title: "Forward alerts",
          list: predictiveAlerts.map((alert) => ({
            badge: "Predict",
            badgeTone: "warn" as const,
            text: alert.title,
            sub: alert.body,
          })),
        },
        {
          type: "panel",
          title: "Current insights",
          list: insights.map((item) => ({
            badge: "Now",
            text: item.title,
            sub: item.body,
          })),
        },
      ]}
    />
  );
}
