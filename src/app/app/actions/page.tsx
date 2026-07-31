import { AppShell } from "@/components/AppShell";
import { ActionsStudio } from "@/components/ActionsStudio";

export default function ActionsPage() {
  return (
    <AppShell
      title="Atlas Actions"
      subtitle="The centerpiece — tell Atlas the outcome. It creates, sends, reminds, updates the books, and continues the same conversation on every device."
      action={<button className="btn btn-dark">Open on phone</button>}
    >
      <ActionsStudio />
    </AppShell>
  );
}
