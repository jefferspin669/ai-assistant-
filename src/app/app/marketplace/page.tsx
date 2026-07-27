import { AppShell } from "@/components/AppShell";
import { MarketplaceStudio } from "@/components/MarketplaceStudio";

export default function MarketplacePage() {
  return (
    <AppShell
      title="AI Marketplace"
      subtitle="Developers create industry agents, dashboards, automations, reports, integrations, and templates. Businesses install what they need."
      action={<button className="btn btn-dark">Publish listing</button>}
    >
      <MarketplaceStudio />
    </AppShell>
  );
}
