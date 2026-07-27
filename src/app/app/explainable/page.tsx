import { AppShell } from "@/components/AppShell";
import { ExplainableAIStudio } from "@/components/ExplainableAIStudio";

export default function ExplainablePage() {
  return (
    <AppShell
      title="Explainable AI"
      subtitle="Every recommendation shows why, supporting data, risks, expected outcomes, confidence, and alternatives."
      action={<button className="btn btn-dark">Explain a decision</button>}
    >
      <ExplainableAIStudio />
    </AppShell>
  );
}
