import { FeatureView } from "@/components/FeatureView";
import { schedulingFactors } from "@/lib/atlas-platform";

export default function SchedulingPage() {
  return (
    <FeatureView
      title="Intelligent Scheduling"
      subtitle="Atlas figures out who should go — not simply the first available."
      sections={[
        {
          type: "stats",
          items: [
            { label: "Assigned", value: "John Hale", detail: "Best match for Elena" },
            { label: "Drive time", value: "12 min", detail: "Lowest among qualified" },
            { label: "Fit score", value: "96", detail: "Experience + preference" },
            { label: "Overtime risk", value: "None", detail: "Finishes on shift" },
          ],
        },
        {
          type: "panel",
          title: "Decision factors",
          list: schedulingFactors.map((f) => ({
            badge: "Weighs",
            text: f.label,
            sub: f.detail,
          })),
        },
        {
          type: "chat",
          title: "Why John",
          bubbles: [
            { role: "user", text: "Who should take Elena’s AC call?" },
            {
              role: "ai",
              text: "John — she always requests him, he’s closest with the right parts, and it won’t push overtime. Sam is free earlier but lacks the capacitor on-truck.",
            },
          ],
        },
      ]}
    />
  );
}
