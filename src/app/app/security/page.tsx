import { FeatureView } from "@/components/FeatureView";
import { securityEvents } from "@/lib/atlas-platform";

export default function SecurityPage() {
  return (
    <FeatureView
      title="AI Security Center"
      subtitle="Detects suspicious logins, fraud, data leaks, unusual spending, and account changes."
      sections={[
        {
          type: "stats",
          items: [
            { label: "Threats blocked", value: "3", detail: "Last 7 days" },
            { label: "Pending approvals", value: "1", detail: "Customer export" },
            { label: "Healthy connectors", value: "12", detail: "Keys rotated" },
            { label: "Risk level", value: "Low", detail: "Monitoring on" },
          ],
        },
        {
          type: "table",
          title: "Recent events",
          headers: ["Event", "Detail", "Status"],
          rows: securityEvents.map((event) => [event.event, event.detail, event.status]),
        },
      ]}
    />
  );
}
