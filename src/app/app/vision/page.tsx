import { AppShell } from "@/components/AppShell";
import { VisionStudio } from "@/components/VisionStudio";

export default function VisionPage() {
  return (
    <AppShell
      title="Atlas Vision"
      subtitle="Employees upload pictures. Atlas understands them — HVAC, restaurant, retail, and construction."
      action={<button className="btn btn-dark">Upload photo</button>}
    >
      <VisionStudio />
    </AppShell>
  );
}
