import { AppShell } from "@/components/AppShell";
import { TwinStudio } from "@/components/TwinStudio";

export default function DigitalTwinPage() {
  return (
    <AppShell
      title="Digital Twin"
      subtitle="A live digital model of employees, customers, inventory, cash flow, marketing, equipment, locations, and performance — simulate before you decide."
      action={<button className="btn btn-dark">Run simulation</button>}
    >
      <TwinStudio />
    </AppShell>
  );
}
