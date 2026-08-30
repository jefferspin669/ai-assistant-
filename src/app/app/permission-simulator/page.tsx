import { AppShell } from "@/components/AppShell";
import { PermissionSimulatorStudio } from "@/components/PermissionSimulatorStudio";

export default function PermissionSimulatorPage() {
  return (
    <AppShell
      title="Permission Simulator"
      subtitle="Preview exactly what an employee will see before you change their access — so payroll or confidential data is never exposed by accident."
    >
      <PermissionSimulatorStudio />
    </AppShell>
  );
}
