import { FeatureView } from "@/components/FeatureView";
import { coachExamples } from "@/lib/atlas-platform";

export default function CoachPage() {
  return (
    <FeatureView
      title="Live AI Coach"
      subtitle="Employees ask in the moment — Atlas answers from policy, manuals, and past jobs."
      sections={[
        {
          type: "chat",
          title: "On the job",
          bubbles: coachExamples.flatMap((ex) => [
            { role: "user" as const, text: ex.q },
            { role: "ai" as const, text: ex.a },
          ]),
        },
        {
          type: "panel",
          title: "Also covers",
          list: [
            { badge: "Assist", text: "How do I reset this machine?" },
            { badge: "Assist", text: "What’s the warranty language for this install?" },
            { badge: "Assist", text: "Walk me through a difficult refund conversation." },
          ],
        },
      ]}
    />
  );
}
