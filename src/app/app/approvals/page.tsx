import { AppShell } from "@/components/AppShell";
import { ApprovalInboxStudio } from "@/components/ApprovalInboxStudio";
import { ConfirmationStudio } from "@/components/ConfirmationStudio";

export default function ApprovalsPage() {
  return (
    <AppShell
      title="Approvals"
      subtitle="Everything waiting on you — live exceptions, inbox requests, and risky actions Atlas will not run until you confirm."
    >
      <ApprovalInboxStudio />
      <ConfirmationStudio embedded />
    </AppShell>
  );
}
