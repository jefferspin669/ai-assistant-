import Link from "next/link";
import { operatingSystemApps } from "@/lib/atlas-platform";

export function OperatingSystemStudio() {
  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">AI Operating System</p>
          <h2>Everything inside one workspace.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            Email, phone, calendar, CRM, inventory, invoices, payroll, marketing, projects,
            documents, analytics — one login, one memory, one AI.
          </p>
        </div>
        <ul className="plain-list">
          <li>One login</li>
          <li>One shared Atlas memory</li>
          <li>One AI across every app</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Workspace</h2>
        <div className="pack-grid dense" style={{ marginTop: "0.85rem" }}>
          {operatingSystemApps.map((app) => (
            <Link key={app.name} href={app.href} className="pack-card panel" style={{ padding: "1rem" }}>
              <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>{app.name}</strong>
              <p style={{ color: "var(--ink-soft)", marginTop: "0.35rem" }}>{app.detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
