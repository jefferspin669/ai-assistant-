import { FeatureView } from "@/components/FeatureView";
import { campaigns } from "@/lib/data";
import { marketingAssets } from "@/lib/atlas-platform";

export default function MarketingPage() {
  return (
    <FeatureView
      title="Marketing AI"
      subtitle="Facebook, Instagram, email, SMS, flyers, coupons, holiday promotions, and seasonal reminders — drafted by Atlas."
      sections={[
        {
          type: "table",
          title: "Campaigns",
          headers: ["Name", "Type", "Status", "Reach"],
          rows: campaigns.map((c) => [c.name, c.type, c.status, c.reach]),
        },
        {
          type: "table",
          title: "Ready creatives",
          headers: ["Channel", "Asset", "Status"],
          rows: marketingAssets.map((a) => [a.channel, a.item, a.status]),
        },
      ]}
    />
  );
}
