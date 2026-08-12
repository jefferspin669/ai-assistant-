import { AppShell } from "@/components/AppShell";
import { CalendarHubStudio } from "@/components/CalendarHubStudio";

export default function CalendarHubPage() {
  return (
    <AppShell
      title="Atlas Calendar Hub"
      subtitle="A private CEO calendar plus shared company, team, department, project, and location calendars — with per-event audiences and calendar overlays."
    >
      <CalendarHubStudio />
    </AppShell>
  );
}
