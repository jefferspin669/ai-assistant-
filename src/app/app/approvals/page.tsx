import { AppShell } from "@/components/AppShell";
import { ApprovalInboxStudio } from "@/components/ApprovalInboxStudio";

export default function ApprovalsPage() {
  return (
    <AppShell
      title="Approval Inbox"
      subtitle="Everything waiting on you — prioritized by Atlas — with Approve, Reject, and Ask a Question in one place."
    >
      <ApprovalInboxStudio />
    </AppShell>
  );
}
