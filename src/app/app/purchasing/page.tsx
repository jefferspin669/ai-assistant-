import { FeatureView } from "@/components/FeatureView";
import { purchasingCompares } from "@/lib/atlas-platform";

export default function PurchasingPage() {
  return (
    <FeatureView
      title="Purchasing AI"
      subtitle="Compare suppliers, find cheaper prices, track deliveries, and predict shortages."
      sections={[
        {
          type: "table",
          title: "Supplier compare",
          headers: ["Part", "Supplier", "Price", "ETA", "Pick"],
          rows: purchasingCompares.map((row) => [
            row.part,
            row.supplier,
            row.price,
            row.eta,
            row.pick ? "Recommended" : "—",
          ]),
        },
        {
          type: "panel",
          title: "Automation",
          list: [
            { badge: "Auto", badgeTone: "ok", text: "Draft POs when stock hits reorder point" },
            { badge: "Track", text: "Delivery ETAs synced to job schedules" },
            { badge: "Watch", badgeTone: "warn", text: "Flag price spikes above 8%" },
          ],
        },
      ]}
    />
  );
}
