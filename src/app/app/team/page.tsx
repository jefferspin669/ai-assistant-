import { AppShell } from "@/components/AppShell";
import { EmployeeHubStudio } from "@/components/EmployeeHubStudio";

export default function TeamPage() {
  return (
    <AppShell
      title="Employee Hub"
      subtitle="Each employee gets schedule, training, messages, documents, an AI assistant, performance, PTO requests, and time-off balances."
      action={<button className="btn btn-dark">Invite employee</button>}
    >
      <EmployeeHubStudio />
    </AppShell>
  );
}
