import { AppShell } from "@/components/AppShell";
import { CrisisSimulationStudio } from "@/components/CrisisSimulationStudio";

export default function CrisisPage() {
  return (
    <AppShell
      title="Crisis Simulation"
      subtitle="Simulate a cyberattack, factory shutdown, CEO scandal, recession, supplier collapse, or major lawsuit — and see the likely operational and financial effects."
    >
      <CrisisSimulationStudio />
    </AppShell>
  );
}
