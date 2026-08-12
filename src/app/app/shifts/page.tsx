import { AppShell } from "@/components/AppShell";
import { ShiftSchedulingStudio } from "@/components/ShiftSchedulingStudio";

export default function ShiftsPage() {
  return (
    <AppShell
      title="Scheduling"
      subtitle="Create shifts and post open shifts. Employees request swaps, give up shifts, and pick up open ones — Atlas checks who's qualified and available."
    >
      <ShiftSchedulingStudio />
    </AppShell>
  );
}
