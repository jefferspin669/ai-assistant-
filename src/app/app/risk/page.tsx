import { AppShell } from "@/components/AppShell";
import { RiskCenterStudio } from "@/components/RiskCenterStudio";

export default function RiskPage() {
  return (
    <AppShell
      title="AI Risk Center"
      subtitle="Warns before problems become expensive — satisfaction, burnout, compliance, equipment, cash flow, and unusual activity."
    >
      <RiskCenterStudio />
    </AppShell>
  );
}
