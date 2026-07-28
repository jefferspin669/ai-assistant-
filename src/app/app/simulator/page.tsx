import { AppShell } from "@/components/AppShell";
import { SimulatorStudio } from "@/components/SimulatorStudio";

export default function SimulatorPage() {
  return (
    <AppShell
      title="Business Simulator"
      subtitle="Ask what happens if wages, costs, or demand change — then see payroll, pricing, profit, hiring, and cash impact."
    >
      <SimulatorStudio />
    </AppShell>
  );
}
