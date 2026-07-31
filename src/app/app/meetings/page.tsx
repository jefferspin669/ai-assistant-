import { AppShell } from "@/components/AppShell";
import { MeetingStudio } from "@/components/MeetingStudio";

export default function MeetingsPage() {
  return (
    <AppShell
      title="Meeting Intelligence"
      subtitle="Join online meetings, take notes, record action items, generate summaries, assign follow-ups, and email recaps automatically."
      action={<button className="btn btn-dark">New meeting</button>}
    >
      <MeetingStudio />
    </AppShell>
  );
}
