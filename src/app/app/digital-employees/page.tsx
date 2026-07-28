import { FeatureView } from "@/components/FeatureView";
import { digitalEmployeeRoster } from "@/lib/atlas-platform";
import { teamAi } from "@/lib/data";

export default function DigitalEmployeesPage() {
  return (
    <FeatureView
      title="AI Digital Employees"
      subtitle="Instead of one AI — specialized teammates that share the same business memory and Business DNA."
      sections={[
        {
          type: "panel",
          title: "Shared company brain",
          body: "You talk to Atlas. Atlas delegates to the right digital employee. Every role reads the same memory and DNA.",
          list: [
            { badge: "Delegate", badgeTone: "ok", text: "Owner speaks naturally — Atlas routes the work." },
            { badge: "Specialize", text: "Each role has different expertise and confirmation rules." },
            { badge: "Align", text: "Tone, pricing, and escalation stay consistent across the staff." },
          ],
        },
        {
          type: "table",
          title: "Digital employee roster",
          headers: ["Role", "Expertise"],
          rows: digitalEmployeeRoster.map((employee) => [
            `${employee.emoji} ${employee.title}`,
            employee.expertise,
          ]),
        },
        {
          type: "panel",
          title: "Named example · Jeff’s Plumbing",
          list: teamAi.map((member) => ({
            badge: member.role,
            text: `${member.name} — ${member.focus}`,
          })),
        },
      ]}
    />
  );
}
