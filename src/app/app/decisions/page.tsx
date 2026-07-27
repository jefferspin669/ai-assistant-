import { AppShell } from "@/components/AppShell";
import { DecisionEngineStudio } from "@/components/DecisionEngineStudio";

export default function DecisionsPage() {
  return (
    <AppShell
      title="AI Decision Engine"
      subtitle="Before major decisions, Atlas automatically evaluates financial, legal, customer, workload, operational, risk, return, and alternatives."
      action={<button className="btn btn-dark">New evaluation</button>}
    >
      <DecisionEngineStudio />
    </AppShell>
  );
}
