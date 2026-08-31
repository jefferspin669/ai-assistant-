import { AppShell } from "@/components/AppShell";
import { ComplianceStudio } from "@/components/ComplianceStudio";

export default function CompliancePage() {
  return (
    <AppShell
      title="Compliance"
      subtitle="Tracks license renewals, safety inspections, insurance expirations, required certifications, OSHA reminders, and industry regulations."
      action={<button className="btn btn-dark">Add requirement</button>}
    >
      <ComplianceStudio />
    </AppShell>
  );
}
