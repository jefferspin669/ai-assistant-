import { AppShell } from "@/components/AppShell";
import { SalesStudio } from "@/components/SalesStudio";

export default function SalesPage() {
  return (
    <AppShell
      title="Sales"
      subtitle="Pipeline, win rate, and revenue — honest labeling when data is not connected or verified."
    >
      <SalesStudio />
    </AppShell>
  );
}
