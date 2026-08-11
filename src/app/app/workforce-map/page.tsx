import { AppShell } from "@/components/AppShell";
import { WorkforceMapStudio } from "@/components/WorkforceMapStudio";

export default function WorkforceMapPage() {
  return (
    <AppShell
      title="Workforce Map"
      subtitle="Your whole workforce on one screen — and ask Atlas anything about it."
    >
      <WorkforceMapStudio />
    </AppShell>
  );
}
