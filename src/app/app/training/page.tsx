import { AppShell } from "@/components/AppShell";
import { TrainingStudio } from "@/components/TrainingStudio";

export default function TrainingPage() {
  return (
    <AppShell
      title="AI Training"
      subtitle="New employee? Atlas teaches them — interactive lessons, quizzes, voice practice, roleplay, and progress tracking."
      action={<button className="btn btn-dark">Assign curriculum</button>}
    >
      <TrainingStudio />
    </AppShell>
  );
}
