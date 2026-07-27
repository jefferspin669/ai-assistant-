import { FeatureView } from "@/components/FeatureView";
import { marketplaceAssistants } from "@/lib/data";
import { marketplaceShares } from "@/lib/atlas-platform";

export default function MarketplacePage() {
  return (
    <FeatureView
      title="Atlas Marketplace"
      subtitle="Sell and share workflows, prompts, dashboards, industry templates, automation packs, reports, and training courses."
      sections={[
        {
          type: "table",
          title: "Installable assistants",
          headers: ["Assistant", "Category", "Installs"],
          rows: marketplaceAssistants.map((item) => [item.name, item.category, item.installs]),
        },
        {
          type: "table",
          title: "Shared packs",
          headers: ["Name", "Type", "Rating"],
          rows: marketplaceShares.map((item) => [item.name, item.type, item.rating]),
        },
      ]}
    />
  );
}
