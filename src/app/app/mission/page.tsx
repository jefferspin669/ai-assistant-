import { AppShell } from "@/components/AppShell";
import { MissionStudio } from "@/components/MissionStudio";

export default function MissionPage() {
  return (
    <AppShell
      title="Mission"
      subtitle="Company goals and objectives — what Atlas is aiming the workforce at."
      action={<button className="btn btn-dark">Share the mission</button>}
    >
      <MissionStudio />
    </AppShell>
  );
}
