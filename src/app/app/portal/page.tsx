import { AppShell } from "@/components/AppShell";
import { PortalStudio } from "@/components/PortalStudio";

export default function PortalPage() {
  return (
    <AppShell
      title="Customer Portal Generator"
      subtitle="Instantly build a branded portal where customers schedule, pay, chat with AI, upload documents, track orders, and open tickets."
    >
      <PortalStudio />
    </AppShell>
  );
}
