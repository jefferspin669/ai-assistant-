import { FeatureView } from "@/components/FeatureView";
import { inventoryItems } from "@/lib/atlas-platform";

export default function InventoryPage() {
  return (
    <FeatureView
      title="AI Inventory"
      subtitle="Atlas predicts shortages before they strand a truck — order in five days, not after the stockout."
      sections={[
        {
          type: "table",
          title: "Stock outlook",
          headers: ["SKU", "Item", "On hand", "Days left", "Action"],
          rows: inventoryItems.map((item) => [
            item.sku,
            item.name,
            String(item.onHand),
            String(item.daysLeft),
            item.action,
          ]),
        },
        {
          type: "chat",
          title: "Inventory brain",
          bubbles: [
            { role: "user", text: "What am I running low on?" },
            {
              role: "ai",
              text: "You’re running low on 16×25 filters. Order in five days. Thermostats should be reordered now — two left across trucks.",
            },
          ],
        },
      ]}
    />
  );
}
