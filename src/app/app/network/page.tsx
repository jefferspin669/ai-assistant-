import { FeatureView } from "@/components/FeatureView";
import { intelligenceNetworkInsights } from "@/lib/atlas-platform";

export default function NetworkPage() {
  return (
    <FeatureView
      title="Atlas Intelligence Network"
      subtitle="Thousands of businesses. Shared industry trends. Zero exposure of anyone’s private data."
      sections={[
        {
          type: "stats",
          items: [
            { label: "Network businesses", value: "12.4k", detail: "Opt-in aggregated insights" },
            { label: "Private customer data shared", value: "0", detail: "Never crosses tenants" },
            { label: "Industries covered", value: "40+", detail: "Regional trend signals" },
          ],
        },
        {
          type: "panel",
          title: "Privacy-first industry signals",
          list: intelligenceNetworkInsights.map((item) => ({
            badge: item.signal,
            badgeTone: "ok" as const,
            text: item.insight,
            sub: `${item.industry} · aggregated · no private customer data`,
          })),
        },
        {
          type: "panel",
          title: "How it works",
          list: [
            {
              badge: "Private",
              text: "Each business keeps customers, calls, and documents inside its own account.",
            },
            {
              badge: "Aggregate",
              text: "Atlas computes anonymized patterns across the network.",
            },
            {
              badge: "Action",
              text: "You get benchmarks and playbooks — never someone else’s CRM.",
            },
          ],
        },
      ]}
    />
  );
}
