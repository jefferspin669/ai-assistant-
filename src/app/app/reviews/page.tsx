import { FeatureView } from "@/components/FeatureView";
import { reviews } from "@/lib/data";

export default function ReviewsPage() {
  return (
    <FeatureView
      title="Reputation Manager"
      subtitle="Requests reviews, responds, detects fakes, and alerts the owner."
      sections={[
        {
          type: "stats",
          items: [
            { label: "Average rating", value: "4.9", detail: "147 reviews" },
            { label: "Requests sent", value: "38", detail: "This month" },
            { label: "Fake flags", value: "1", detail: "Needs owner review" },
            { label: "Response rate", value: "100%", detail: "AI drafts ready" },
          ],
        },
        {
          type: "split",
          left: {
            title: "Automation",
            list: [
              { badge: "Auto", badgeTone: "ok", text: "Request reviews after paid jobs" },
              { badge: "Auto", badgeTone: "ok", text: "Draft public replies in your voice" },
              { badge: "Watch", badgeTone: "warn", text: "Detect suspicious review patterns" },
              { badge: "Alert", text: "Ping owner on 1–3 star reviews" },
            ],
          },
          right: {
            title: "Latest reviews",
            list: reviews.map((r) => ({
              badge: `${r.rating}★`,
              text: r.text,
              sub: `${r.source} · ${r.author}`,
            })),
          },
        },
      ]}
    />
  );
}
