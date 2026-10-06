import { AppShell } from "@/components/AppShell";
import { ApprovalInboxStudio } from "@/components/ApprovalInboxStudio";

export default function ApprovalsPage() {
  return (
    <AppShell
      title="Approvals"
      subtitle="One server queue — approve or reject what Atlas staged. Local demo inboxes are not mixed in."
    >
      <ApprovalInboxStudio />
    </AppShell>
  );
}
