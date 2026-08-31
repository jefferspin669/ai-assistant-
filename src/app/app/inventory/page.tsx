import { AppShell } from "@/components/AppShell";
import { InventoryStudio } from "@/components/InventoryStudio";
import Link from "@/components/SiteLink";

export default function InventoryPage() {
  return (
    <AppShell
      title="Inventory"
      subtitle="Real stock tracking — add items, log usage, stock movements, and purchasing intelligence."
      action={
        <div className="cta-row">
          <Link className="btn btn-outline" href="/app/inventory?tab=use">Use inventory</Link>
          <Link className="btn btn-outline" href="/app/inventory?tab=intelligence">Intelligence</Link>
          <Link className="btn btn-outline" href="/app/purchasing?tab=scan">Scan receipt</Link>
        </div>
      }
    >
      <InventoryStudio />
    </AppShell>
  );
}
