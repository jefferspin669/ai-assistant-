import { AppShell } from "@/components/AppShell";
import { NegotiationStudio } from "@/components/NegotiationStudio";

export default function NegotiationPage() {
  return (
    <AppShell
      title="Negotiation War Room"
      subtitle="Prepare for acquisitions, major contracts, funding rounds, labor talks, partnerships, and government meetings — leverage, BATNA, tactics, and concessions."
    >
      <NegotiationStudio />
    </AppShell>
  );
}
