import { AppShell } from "@/components/AppShell";
import { SalesCoachStudio } from "@/components/SalesCoachStudio";

export default function SalesCoachPage() {
  return (
    <AppShell
      title="AI Sales Coach"
      subtitle="Analyze sales calls for talk/listen ratio, objection handling, missed opportunities, closing probability, and coaching suggestions."
    >
      <SalesCoachStudio />
    </AppShell>
  );
}
