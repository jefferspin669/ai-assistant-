import { AppShell } from "@/components/AppShell";
import { ComputerControlStudio } from "@/components/ComputerControlStudio";

export default function ComputerControlPage() {
  return (
    <AppShell
      title="AI Computer Control"
      subtitle="With permission, Atlas opens apps, fills forms, builds spreadsheets, sends email, generates reports, and organizes files."
      action={<button className="btn btn-dark">Review audit log</button>}
    >
      <ComputerControlStudio />
    </AppShell>
  );
}
