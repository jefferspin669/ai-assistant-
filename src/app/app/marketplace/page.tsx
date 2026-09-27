import { AppShell } from "@/components/AppShell";
import { MarketplaceStudio } from "@/components/MarketplaceStudio";

export default function MarketplacePage() {
  return (
    <AppShell
      title="Atlas Marketplace"
      subtitle="Agents, integrations, workflows, and industry packs — where businesses expand Atlas."
    >
      <MarketplaceStudio />
    </AppShell>
  );
}
