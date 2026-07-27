import { FeatureView } from "@/components/FeatureView";
import { meetingNotes } from "@/lib/atlas-platform";

export default function MeetingsPage() {
  return (
    <FeatureView
      title="AI Meeting Assistant"
      subtitle="Records meetings and creates notes, decisions, tasks, deadlines, and summaries."
      sections={[
        {
          type: "split",
          left: {
            title: meetingNotes.title,
            list: [
              ...meetingNotes.notes.map((note) => ({ badge: "Note", text: note })),
              ...meetingNotes.decisions.map((decision) => ({
                badge: "Decision",
                badgeTone: "ok" as const,
                text: decision,
              })),
            ],
          },
          right: {
            title: "Tasks",
            list: meetingNotes.tasks.map((task) => ({
              badge: task.due,
              text: task.task,
              sub: task.owner,
            })),
          },
        },
      ]}
    />
  );
}
