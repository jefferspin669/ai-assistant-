import { AppShell } from "@/components/AppShell";
import { WorkforceStatusStudio } from "@/components/WorkforceStatusStudio";

export default function WorkforceStatusPage() {
  return (
    <AppShell
      title="Workforce Status"
      subtitle="See which employees are online and working right now, what they're on, and assign tasks that show up on their own page."
    >
      <WorkforceStatusStudio />
    </AppShell>
  );
}
