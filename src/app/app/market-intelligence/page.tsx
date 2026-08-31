import { AppShell } from "@/components/AppShell";
import { MarketIntelligenceStudio } from "@/components/MarketIntelligenceStudio";

export default function MarketIntelligencePage() {
  return (
    <AppShell
      title="Atlas Market Intelligence"
      subtitle="Competitor profiles, public signals, competitive alerts, and simulator-linked response planning."
    >
      <MarketIntelligenceStudio />
    </AppShell>
  );
}
