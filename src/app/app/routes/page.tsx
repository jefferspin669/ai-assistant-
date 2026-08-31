import { AppShell } from "@/components/AppShell";
import { RoutesStudio } from "@/components/RoutesStudio";

export default function RoutesPage() {
  return (
    <AppShell
      title="Route Optimization"
      subtitle="Logistics with live map — real addresses, traffic-aware drive times, priorities, windows, capacity, and availability."
    >
      <RoutesStudio />
    </AppShell>
  );
}
