import { AppShell } from "@/components/AppShell";
import { TeamTrainingStudio } from "@/components/TeamTrainingStudio";

export default function TeamTrainingPage() {
  return (
    <AppShell
      title="Training & Certifications"
      subtitle="See who needs training and which licenses are expiring — before they lapse."
    >
      <TeamTrainingStudio />
    </AppShell>
  );
}
