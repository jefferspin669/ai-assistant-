import { AppShell } from "@/components/AppShell";
import { QualityStudio } from "@/components/QualityStudio";

export default function QualityPage() {
  return (
    <AppShell
      title="AI Quality Control"
      subtitle="Patterns from complaints, tickets, reviews, refunds, and project issues — with alerts and improvement actions."
    >
      <QualityStudio />
    </AppShell>
  );
}
