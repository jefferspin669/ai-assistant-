import { AppShell } from "@/components/AppShell";
import { SuccessionStudio } from "@/components/SuccessionStudio";

export default function SuccessionPage() {
  return (
    <AppShell
      title="Succession Planner"
      subtitle="Model what happens if the founder steps away, sells, dies, or hands control to another executive — and how ready the company is for each."
    >
      <SuccessionStudio />
    </AppShell>
  );
}
