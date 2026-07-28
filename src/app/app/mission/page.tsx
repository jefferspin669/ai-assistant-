import { AppShell } from "@/components/AppShell";
import { MissionStudio } from "@/components/MissionStudio";

export default function MissionPage() {
  return (
    <AppShell
      title="Atlas Mission"
      subtitle="Every business deserves an intelligent workforce, regardless of its size."
      action={<button className="btn btn-dark">Share the mission</button>}
    >
      <MissionStudio />
    </AppShell>
  );
}
