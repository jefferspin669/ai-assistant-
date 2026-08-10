import { AppShell } from "@/components/AppShell";
import { RiskRadarStudio } from "@/components/RiskRadarStudio";

export default function RiskRadarPage() {
  return (
    <AppShell
      title="Global Risk Radar"
      subtitle="Watch supply-chain disruption, regulatory change, currency risk, geopolitical exposure, cybersecurity threats, and major market shifts across every company."
    >
      <RiskRadarStudio />
    </AppShell>
  );
}
