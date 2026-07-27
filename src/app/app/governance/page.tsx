import { AppShell } from "@/components/AppShell";
import { GovernanceStudio } from "@/components/GovernanceStudio";

export default function GovernancePage() {
  return (
    <AppShell
      title="AI Trust & Governance"
      subtitle="Approval workflows, audit logs, role-based permissions, data retention, human approval for sensitive decisions, and compliance reporting."
      action={<button className="btn btn-dark">Review approvals</button>}
    >
      <GovernanceStudio />
    </AppShell>
  );
}
