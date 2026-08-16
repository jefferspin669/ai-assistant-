import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";
import { MissionControlStudio } from "@/components/MissionControlStudio";

export default function MissionControlPage() {
  return (
    <AppShell
      title="Atlas Mission Control"
      subtitle="The command bridge — Atlas already knows what happened overnight, what’s live now, what’s next, which decisions need you, what it can automate, and where the opportunities are."
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
