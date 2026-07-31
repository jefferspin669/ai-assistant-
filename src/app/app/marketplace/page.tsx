import { AppShell } from "@/components/AppShell";
import { MarketplaceStudio } from "@/components/MarketplaceStudio";

export default function MarketplacePage() {
  return (
    <AppShell
      title="AI Agent Marketplace"
      subtitle="Install specialized AI employees — Sales, HR, Marketing, Accountant, Support, Legal, Real Estate, Fitness — or publish your own."
      action={<button className="btn btn-dark">Publish listing</button>}
    >
      <MarketplaceStudio />
    </AppShell>
  );
}
