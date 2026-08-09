import { AppShell } from "@/components/AppShell";
import { MnaIntelligenceStudio } from "@/components/MnaIntelligenceStudio";

export default function MnaIntelligencePage() {
  return (
    <AppShell
      title="M&A Intelligence"
      subtitle="Screen acquisition targets, compare companies, model synergies, surface red flags, track due diligence, and build integration plans."
    >
      <MnaIntelligenceStudio />
    </AppShell>
  );
}
