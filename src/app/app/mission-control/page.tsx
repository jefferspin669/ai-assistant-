import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";
import { MissionControlStudio } from "@/components/MissionControlStudio";

export default function MissionControlPage() {
  return (
    <AppShell
      title="Mission Control"
      subtitle="Live Atlas and autonomous operations — overnight, what’s running now, and which decisions still need you. Dashboard is status; Executive is strategy."
      action={
        <Link className="btn btn-dark" href="/app/decisions">
          Open decisions
        </Link>
      }
    >
      <MissionControlStudio />
    </AppShell>
  );
}
