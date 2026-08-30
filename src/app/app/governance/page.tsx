import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";

const AREAS: { emoji: string; title: string; blurb: string; href: string }[] = [
  { emoji: "👤", title: "Roles", blurb: "Presets and custom roles like Regional Manager.", href: "/app/control-center" },
  { emoji: "🔑", title: "Permissions", blurb: "Leveled access per category, per employee.", href: "/app/control-center" },
  { emoji: "🔎", title: "Permission Simulator", blurb: "Preview exactly what an employee will see.", href: "/app/permission-simulator" },
  { emoji: "✅", title: "Approval Rules", blurb: "Conditional approval tiers by amount.", href: "/app/control-center" },
  { emoji: "🤖", title: "Automation Limits", blurb: "Auto-approve within CEO-set limits.", href: "/app/control-center" },
  { emoji: "⏳", title: "Temporary Access", blurb: "Time-boxed access that auto-expires.", href: "/app/control-center" },
  { emoji: "🧑‍⚖️", title: "Delegated Authority", blurb: "Let an executive act with your authority.", href: "/app/control-center" },
  { emoji: "🛡️", title: "Security Policies", blurb: "Step-up (password / 2FA) for sensitive actions.", href: "/app/control-center" },
  { emoji: "🕓", title: "Audit Logs", blurb: "Every permission-related action, recorded.", href: "/app/access" },
  { emoji: "📥", title: "Approval History", blurb: "The approval inbox and past decisions.", href: "/app/approvals" },
  { emoji: "🚨", title: "Emergency Access", blurb: "Break-glass access, fully recorded.", href: "/app/control-center" },
];

export default function GovernancePage() {
  return (
    <AppShell
      title="Atlas Governance"
      subtitle="Leadership stays in control — even as AI and automation do more of the work."
    >
      <div className="training-studio">
        <section className="panel">
          <h2>Governance areas</h2>
          <p className="panel-lead">One home for roles, permissions, approvals, and audit — everything that keeps access safe.</p>
          <div className="pack-grid">
            {AREAS.map((a) => (
              <Link key={a.title} href={a.href} className="pack-card" style={{ textAlign: "left", textDecoration: "none" }}>
                <div style={{ fontSize: "1.4rem" }}>{a.emoji}</div>
                <strong>{a.title}</strong>
                <span className="muted-line">{a.blurb}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
