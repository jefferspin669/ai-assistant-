import { AppShell } from "@/components/AppShell";
import { ExecutiveTimelineStudio } from "@/components/ExecutiveTimelineStudio";

export default function ExecutiveTimelinePage() {
  return (
    <AppShell
      title="Executive Timeline"
      subtitle="Everything important — funding, hiring, customers, lawsuits, launches, revenue, equipment, acquisitions, compliance — on one timeline."
      action={<button className="btn btn-dark">Add event</button>}
    >
      <ExecutiveTimelineStudio />
    </AppShell>
  );
}
