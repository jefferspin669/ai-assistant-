import Link from "@/components/SiteLink";
import { isDemoWorkspace, workspaceStatusLabel } from "@/lib/workspace-mode";

export function DemoWorkspaceBanner() {
  if (!isDemoWorkspace()) return null;
  return (
    <div className="memory-card" style={{ marginBottom: "1rem", borderColor: "var(--warn, #c9a227)" }}>
      <div className="label">{workspaceStatusLabel()}</div>
      <p>
        You are viewing a <strong>sample workspace</strong> for evaluation. Numbers, employees, and activity are not
        real.{" "}
        <Link href="/app/setup">Activate your company workspace</Link> to remove demo data and use production mode.
      </p>
    </div>
  );
}
