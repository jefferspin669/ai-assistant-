import { AppShell } from "@/components/AppShell";
import { MarketplaceStudio } from "@/components/MarketplaceStudio";

export default function MarketplacePage() {
  return (
    <AppShell
      title="Atlas Marketplace"
      subtitle="Sell and share workflows, AI prompts, dashboards, industry templates, automation packs, reports, and training courses."
      action={<button className="btn btn-dark">Publish pack</button>}
    >
      <MarketplaceStudio />
    </AppShell>
  );
}
