import { AppShell } from "@/components/AppShell";
import { CeoMemoryStudio } from "@/components/CeoMemoryStudio";

export default function CeoMemoryPage() {
  return (
    <AppShell
      title="CEO Memory"
      subtitle="Atlas remembers every decision — ask why months later and get the date, triggers, and alternatives you reviewed."
      action={<button className="btn btn-dark">Log decision</button>}
    >
      <CeoMemoryStudio />
    </AppShell>
  );
}
