import { AppShell } from "@/components/AppShell";
import Link from "@/components/SiteLink";

export default function CallSummariesPage() {
  return (
    <AppShell
      title="Call summaries"
      subtitle="Summaries require real phone calls and a connected AI service."
    >
      <section className="panel">
        <h2>No call summaries yet</h2>
        <p>
          Connect your phone and AI services to start processing actual calls. Atlas will not
          generate example conversations here.
        </p>
        <Link href="/app/connections" className="btn btn-dark">
          Check connections
        </Link>
      </section>
    </AppShell>
  );
}
