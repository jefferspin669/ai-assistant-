import { AppShell } from "@/components/AppShell";
import { WorkforceMapStudio } from "@/components/WorkforceMapStudio";

export default function WorkforceMapPage() {
  return (
    <AppShell
      title="Workforce Map"
      subtitle="Real locations and employee assignments — privacy-conscious status, not fake pre-populated staff."
    >
      <WorkforceMapStudio />
    </AppShell>
  );
}
