import { AppShell } from "@/components/AppShell";
import { CapitalAllocationStudio } from "@/components/CapitalAllocationStudio";

export default function CapitalPage() {
  return (
    <AppShell
      title="Capital Allocation Engine"
      subtitle="Where should the next $1M, $10M, or $100M go — expansion, acquisitions, debt payoff, hiring, R&D, buybacks, real estate, or reserves?"
    >
      <CapitalAllocationStudio />
    </AppShell>
  );
}
