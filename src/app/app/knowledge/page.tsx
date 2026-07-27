import { FeatureView } from "@/components/FeatureView";
import { knowledgeUploads } from "@/lib/atlas-platform";

export default function KnowledgePage() {
  return (
    <FeatureView
      title="Business Knowledge Base"
      subtitle="Upload the business. Atlas learns handbooks, price sheets, contracts, manuals, videos, images, and floor plans."
      action={<button className="btn btn-dark">Upload documents</button>}
      sections={[
        {
          type: "table",
          title: "Library",
          headers: ["File", "Type", "Status", "Size"],
          rows: knowledgeUploads.map((item) => [
            item.name,
            item.type,
            item.status,
            item.pages === 1 ? "1 item" : `${item.pages} pages`,
          ]),
        },
        {
          type: "split",
          left: {
            title: "Accepted uploads",
            list: [
              { badge: "PDF", text: "Employee handbook, manuals, policies" },
              { badge: "Sheets", text: "Price lists and rate cards" },
              { badge: "Docs", text: "Contracts, SOPs, training docs" },
              { badge: "Media", text: "Videos, images, floor plans" },
            ],
          },
          right: {
            title: "Ask the business",
            list: [
              {
                badge: "Ready",
                badgeTone: "ok",
                text: "What’s our refund window on water heaters?",
              },
              {
                badge: "Ready",
                badgeTone: "ok",
                text: "Summarize the safety section for new hires.",
              },
              {
                badge: "Ready",
                badgeTone: "ok",
                text: "What’s the after-hours emergency rate?",
              },
            ],
          },
        },
      ]}
    />
  );
}
