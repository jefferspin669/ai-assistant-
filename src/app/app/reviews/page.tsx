import { AppShell } from "@/components/AppShell";
import { ReputationStudio } from "@/components/ReputationStudio";

export default function ReviewsPage() {
  return (
    <AppShell
      title="Reputation"
      subtitle="Connected review sources, unified inbox, sentiment, draft replies, and owner approval."
    >
      <ReputationStudio />
    </AppShell>
  );
}
