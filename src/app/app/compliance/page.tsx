import { FeatureView } from "@/components/FeatureView";
import { complianceItems } from "@/lib/atlas-platform";

export default function CompliancePage() {
  return (
    <FeatureView
      title="AI Compliance"
      subtitle="License renewals, safety inspections, insurance, certifications, OSHA reminders, and industry rules — tracked in one place."
      sections={[
        {
          type: "table",
          title: "Compliance board",
          headers: ["Item", "Due", "Status"],
          rows: complianceItems.map((item) => [item.item, item.due, item.status]),
        },
        {
          type: "panel",
          title: "Reminders",
          list: [
            { badge: "Soon", badgeTone: "warn", text: "Liability insurance renews Aug 3" },
            { badge: "Weekly", text: "OSHA toolbox talk due Friday" },
            { badge: "OK", badgeTone: "ok", text: "EPA 608 for John Hale current" },
          ],
        },
      ]}
    />
  );
}
