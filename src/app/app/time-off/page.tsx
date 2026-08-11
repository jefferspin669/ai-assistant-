import { AppShell } from "@/components/AppShell";
import { TimeOffStudio } from "@/components/TimeOffStudio";

export default function TimeOffPage() {
  return (
    <AppShell
      title="Time-Off Requests"
      subtitle="Review PTO requests with automatic staffing checks before you approve."
    >
      <TimeOffStudio />
    </AppShell>
  );
}
