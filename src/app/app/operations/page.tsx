import { operationsHub } from "@/lib/section-hubs";
import { SectionHub } from "@/components/SectionHub";

export default function OperationsPage() {
  return (
    <SectionHub
      title="Operations"
      subtitle="The beachhead: answer the phone, book the job, keep the trucks moving."
      items={operationsHub}
    />
  );
}
