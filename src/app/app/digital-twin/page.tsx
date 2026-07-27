import { FeatureView } from "@/components/FeatureView";
import { twinLayers } from "@/lib/atlas-platform";

export default function DigitalTwinPage() {
  return (
    <FeatureView
      title="Digital Twin"
      subtitle="A live digital model of the business — simulate changes before you decide."
      sections={[
        {
          type: "panel",
          title: "Live model",
          list: twinLayers.map((layer) => ({
            badge: "Twin",
            text: layer.layer,
            sub: layer.signal,
          })),
        },
        {
          type: "chat",
          title: "Simulate",
          bubbles: [
            { role: "user", text: "What if we open Saturdays and hire one apprentice?" },
            {
              role: "ai",
              text: "Model projects +11% weekly revenue, overtime down 8%, and Intelligence Score to 89 in 6 weeks — if Google Ads budget stays flat.",
            },
          ],
        },
      ]}
    />
  );
}
