import { AppShell } from "@/components/AppShell";
import { EmployeeHubStudio } from "@/components/EmployeeHubStudio";

export default function TeamPage() {
  return (
    <AppShell
      title="Team"
      subtitle="People, schedules, training, and time off."
      action={<button className="btn btn-dark">Invite employee</button>}
    >
      <EmployeeHubStudio />
    </AppShell>
  );
}
