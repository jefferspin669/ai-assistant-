import { FeatureView } from "@/components/FeatureView";
import { routePlan } from "@/lib/atlas-platform";

export default function RoutesPage() {
  return (
    <FeatureView
      title="Route Optimization"
      subtitle="Best driving route, fuel savings, lowest traffic, fastest technician — built for service companies."
      sections={[
        {
          type: "stats",
          items: [
            { label: "Miles saved", value: "18", detail: "vs naive order" },
            { label: "Fuel", value: "-11%", detail: "Today’s plan" },
            { label: "Traffic avoided", value: "Main St", detail: "22 min delay bypassed" },
            { label: "On-time odds", value: "94%", detail: "With buffers" },
          ],
        },
        {
          type: "table",
          title: "Alex’s optimized day",
          headers: ["Stop", "Job", "ETA", "Drive"],
          rows: routePlan.map((stop) => [
            String(stop.stop),
            stop.job,
            stop.eta,
            stop.drive,
          ]),
        },
      ]}
    />
  );
}
