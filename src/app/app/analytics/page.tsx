import { FeatureView } from "@/components/FeatureView";
import { dashboardMetrics } from "@/lib/data";

export default function AnalyticsPage() {
  return (
    <FeatureView
      title="AI Dashboard"
      subtitle="Instead of charts alone — ask why. Atlas explains the business in plain language."
      sections={[
        {
          type: "stats",
          items: dashboardMetrics.slice(0, 8),
        },
        {
          type: "chat",
          title: "Ask the dashboard",
          bubbles: [
            { role: "user", text: "Why were sales lower this week?" },
            {
              role: "ai",
              text: "Two rainy days cut outdoor jobs, and Tuesday still has three open slots. Waitlist texts can fill them before Friday — want me to send?",
            },
          ],
        },
      ]}
    />
  );
}
