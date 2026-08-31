import { AppShell } from "@/components/AppShell";
import { MarketplaceStudio } from "@/components/MarketplaceStudio";

export default function MarketplacePage() {
  return (
    <AppShell
      title="Atlas Marketplace"
      subtitle="One place to discover, install, and publish agents, automations, integrations, templates, and modules."
    >
      <MarketplaceStudio />
    </AppShell>
  );
}
