import { AppShell } from "@/components/AppShell";
import { BusinessMemoryStudio } from "@/components/BusinessMemoryStudio";
import Link from "@/components/SiteLink";

export default function MemoryPage() {
  return (
    <AppShell
      title="Business Memory"
      subtitle="One permission-aware memory engine — company, leadership, employees, customers, and operations."
      action={
        <div className="cta-row">
          <Link className="btn btn-outline" href="/app/knowledge">Knowledge Base</Link>
          <Link className="btn btn-outline" href="/app/global-memory">Memory Settings</Link>
        </div>
      }
    >
      <BusinessMemoryStudio />
    </AppShell>
  );
}
