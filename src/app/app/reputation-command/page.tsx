import { AppShell } from "@/components/AppShell";
import { ReputationCommandStudio } from "@/components/ReputationCommandStudio";

export default function ReputationCommandPage() {
  return (
    <AppShell
      title="Reputation Command Center"
      subtitle="Track major press, customer sentiment, executive reputation, brand crises, lawsuits, and viral issues — with response options ready before they become huge problems."
    >
      <ReputationCommandStudio />
    </AppShell>
  );
}
