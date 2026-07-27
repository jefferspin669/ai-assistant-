import { FeatureView } from "@/components/FeatureView";
import { apiConnectors } from "@/lib/atlas-platform";

export default function DevelopersPage() {
  return (
    <FeatureView
      title="Atlas API"
      subtitle="Connect accounting, payments, calendars, email, SMS, shipping, e-commerce, and custom software."
      action={<button className="btn btn-dark">View API keys</button>}
      sections={[
        {
          type: "panel",
          title: "Connectors",
          list: apiConnectors.map((connector) => ({
            badge: "API",
            text: connector.name,
            sub: connector.examples,
          })),
        },
        {
          type: "panel",
          title: "Developer surface",
          list: [
            { badge: "REST", badgeTone: "ok", text: "Customers, jobs, invoices, messages" },
            { badge: "Webhooks", badgeTone: "ok", text: "Call ended · payment captured · job completed" },
            { badge: "Auth", text: "Scoped API keys with least privilege" },
          ],
        },
      ]}
    />
  );
}
