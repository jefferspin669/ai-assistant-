import { FeatureView } from "@/components/FeatureView";
import { team } from "@/lib/data";
import { trainingModules } from "@/lib/atlas-platform";

export default function TeamPage() {
  return (
    <FeatureView
      title="Employee Hub"
      subtitle="Each employee gets schedule, training, messages, documents, an AI assistant, performance, PTO, and balances."
      sections={[
        {
          type: "table",
          title: "Team",
          headers: ["Name", "Role", "Jobs", "Rating", "Access"],
          rows: team.map((person) => [
            person.name,
            person.role,
            String(person.jobs),
            person.rating,
            person.perms,
          ]),
        },
        {
          type: "split",
          left: {
            title: "Hub modules",
            list: [
              { badge: "Hub", text: "Schedule and job board" },
              { badge: "Hub", text: "Training + quizzes" },
              { badge: "Hub", text: "Messages and documents" },
              { badge: "Hub", text: "Personal AI assistant" },
              { badge: "Hub", text: "Performance dashboard" },
              { badge: "Hub", text: "PTO requests and balances" },
            ],
          },
          right: {
            title: "Alex’s training",
            list: trainingModules.map((mod) => ({
              badge: `${mod.progress}%`,
              text: mod.title,
              sub: mod.type,
            })),
          },
        },
      ]}
    />
  );
}
