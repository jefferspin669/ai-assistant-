import { FeatureView } from "@/components/FeatureView";
import { trainingModules } from "@/lib/atlas-platform";

export default function TrainingPage() {
  return (
    <FeatureView
      title="AI Training"
      subtitle="New employee? Atlas teaches them — interactive lessons, quizzes, voice practice, roleplay, and progress tracking."
      sections={[
        {
          type: "table",
          title: "Curriculum",
          headers: ["Module", "Type", "Progress"],
          rows: trainingModules.map((mod) => [mod.title, mod.type, mod.progress]),
        },
        {
          type: "chat",
          title: "Voice practice",
          bubbles: [
            { role: "ai", text: "A customer says the tech was late. Practice your response." },
            {
              role: "user",
              text: "I’m sorry about the wait — we texted as soon as traffic hit. I can offer a morning make-good window.",
            },
            {
              role: "ai",
              text: "Strong. You acknowledged, explained, and offered a fix. Score 92 — add the goodwill credit script next time if wait exceeded 45 minutes.",
            },
          ],
        },
      ]}
    />
  );
}
