import { salesHub } from "@/lib/section-hubs";
import { SectionHub } from "@/components/SectionHub";

export default function SalesPage() {
  return (
    <SectionHub
      title="Sales"
      subtitle="Quotes, follow-ups, and the front door for new work."
      items={salesHub}
    />
  );
}
