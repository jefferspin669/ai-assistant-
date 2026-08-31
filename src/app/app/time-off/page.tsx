import { AppShell } from "@/components/AppShell";
import { TimeOffStudio } from "@/components/TimeOffStudio";

export default function TimeOffPage() {
  return (
    <AppShell
      title="Time off"
      subtitle="Employee requests, manager approvals, coverage planning, and schedule impact — connected to Workforce scheduling."
    >
      <TimeOffStudio />
    </AppShell>
  );
}
