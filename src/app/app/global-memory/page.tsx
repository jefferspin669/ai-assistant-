import { AppShell } from "@/components/AppShell";
import { GlobalMemoryStudio } from "@/components/GlobalMemoryStudio";

export default function GlobalMemoryPage() {
  return (
    <AppShell
      title="Global Business Memory"
      subtitle="Languages, time zones, tax, regional hours, holidays, currency, and local regulations — with human review where needed."
      action={<button className="btn btn-dark">Add region</button>}
    >
      <GlobalMemoryStudio />
    </AppShell>
  );
}
