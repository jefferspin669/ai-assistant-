import { FeatureView } from "@/components/FeatureView";
import { documentTypes } from "@/lib/atlas-platform";

export default function DocumentsPage() {
  return (
    <FeatureView
      title="AI Document Builder"
      subtitle="Creates contracts, quotes, invoices, letters, reports, policies, forms, and proposals from business knowledge."
      action={<button className="btn btn-dark">New document</button>}
      sections={[
        {
          type: "panel",
          title: "Templates Atlas can draft",
          list: documentTypes.map((type) => ({
            badge: "Build",
            badgeTone: "ok" as const,
            text: type,
          })),
        },
        {
          type: "chat",
          title: "Draft in chat",
          bubbles: [
            { role: "user", text: "Create a maintenance agreement for Jamie Cole." },
            {
              role: "ai",
              text: "Draft ready: annual HVAC maintenance, two visits, filter replacements included, $289/year. Want e-sign sent by text?",
            },
          ],
        },
      ]}
    />
  );
}
