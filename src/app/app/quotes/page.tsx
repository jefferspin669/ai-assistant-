import { FeatureView } from "@/components/FeatureView";
import { quotes } from "@/lib/data";
import { salesInsights } from "@/lib/atlas-platform";

export default function QuotesPage() {
  return (
    <FeatureView
      title="Sales AI"
      subtitle="Tracks lead source, conversion, lost sales, close rate, and revenue — then explains what moved the needle."
      sections={[
        {
          type: "stats",
          items: salesInsights.map((s) => ({
            label: s.metric,
            value: s.value,
            detail: s.detail,
          })),
        },
        {
          type: "table",
          title: "Open pipeline",
          headers: ["ID", "Title", "Customer", "Amount", "Status"],
          rows: quotes.map((q) => [q.id, q.title, q.customer, q.amount, q.status]),
        },
        {
          type: "chat",
          title: "Ask Sales AI",
          bubbles: [
            { role: "user", text: "What drove revenue this month?" },
            {
              role: "ai",
              text: "Google Ads generated 43% more revenue this month. Morning estimate slots still close best — want me to protect more of them next week?",
            },
          ],
        },
      ]}
    />
  );
}
