import { AppShell } from "@/components/AppShell";
import Link from "@/components/SiteLink";

export default function MissedCallsPage() {
  return (
    <AppShell
      title="Missed calls"
      subtitle="Connect a business phone number to receive live call events."
    >
      <section className="panel">
        <h2>No calls to show</h2>
        <p>
          Missed calls will appear after a phone provider is connected and its inbound webhook is
          configured. No example callers are added to your workspace.
        </p>
        <Link href="/app/connections" className="btn btn-dark">
          Check connections
        </Link>
      </section>
    </AppShell>
  );
}
