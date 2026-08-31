import { AppShell } from "@/components/AppShell";
import { CustomerTwinStudio } from "@/components/CustomerTwinStudio";

export default function CustomerTwinPage() {
  return (
    <AppShell
      title="Customer Memory"
      subtitle="A living profile for every customer — purchases, preferences, LTV, service history, satisfaction, loyalty, and upcoming needs."
      action={<button className="btn btn-dark">Personalize outreach</button>}
    >
      <CustomerTwinStudio />
    </AppShell>
  );
}
