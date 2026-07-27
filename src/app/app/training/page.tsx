import { AppShell } from "@/components/AppShell";
import { TrainingStudio } from "@/components/TrainingStudio";

export default function TrainingPage() {
  return (
    <AppShell
      title="Atlas Academy"
      subtitle="Teach employees with interactive lessons, role-playing, certifications, knowledge tests, and voice practice — managers see progress."
      action={<button className="btn btn-dark">Assign curriculum</button>}
    >
      <TrainingStudio />
    </AppShell>
  );
}
