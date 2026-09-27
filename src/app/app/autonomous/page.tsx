import { AppShell } from "@/components/AppShell";
import { AutonomousStudio } from "@/components/AutonomousStudio";

export default function AutonomousPage() {
  return (
    <AppShell
      title="AI Autonomous Mode"
      subtitle="Atlas runs the routine company. You handle exceptions — levels, spending limits, a kill switch, and a 24/7 permission engine."
    >
      <AutonomousStudio />
    </AppShell>
  );
}
