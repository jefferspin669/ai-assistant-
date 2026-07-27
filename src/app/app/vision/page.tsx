import { FeatureView } from "@/components/FeatureView";
import { visionExamples } from "@/lib/atlas-platform";

export default function VisionPage() {
  return (
    <FeatureView
      title="Atlas Vision"
      subtitle="Employees upload pictures. Atlas understands them — HVAC damage, food safety, shelf counts, framing checks."
      action={<button className="btn btn-dark">Upload photo</button>}
      sections={[
        {
          type: "panel",
          title: "Vision examples",
          list: visionExamples.map((example) => ({
            badge: example.industry,
            text: example.result,
          })),
        },
        {
          type: "chat",
          title: "Job site photo",
          bubbles: [
            { role: "user", text: "[Photo uploaded · outdoor unit]" },
            {
              role: "ai",
              text: "This capacitor looks damaged. I matched it to a 45/5 on Alex’s truck and drafted the customer explanation + parts line on the estimate.",
            },
          ],
        },
      ]}
    />
  );
}
