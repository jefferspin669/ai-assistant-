import { AppShell } from "@/components/AppShell";
import { QualityStudio } from "@/components/QualityStudio";

export default function QualityPage() {
  return (
    <AppShell
      title="AI Quality Control"
      subtitle="Reads customer feedback, detects patterns, and alerts the owner — like five customers mentioning “Long wait.”"
      action={<button className="btn btn-dark">Notify owner</button>}
    >
      <QualityStudio />
    </AppShell>
  );
}
