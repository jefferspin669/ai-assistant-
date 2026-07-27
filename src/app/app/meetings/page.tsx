import { AppShell } from "@/components/AppShell";
import { MeetingStudio } from "@/components/MeetingStudio";

export default function MeetingsPage() {
  return (
    <AppShell
      title="AI Meeting Assistant"
      subtitle="Records meetings and creates notes, decisions, tasks, deadlines, and summaries."
      action={<button className="btn btn-dark">New meeting</button>}
    >
      <MeetingStudio />
    </AppShell>
  );
}
