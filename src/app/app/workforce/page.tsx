import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { audiences } from "@/lib/data";

const links: Record<string, string> = {
  individual: "/app/personal",
  family: "/app/personal",
  events: "/app/events",
  business: "/app",
  nonprofit: "/app/marketplace",
  school: "/app/personal",
};

export default function WorkforcePage() {
  return (
    <AppShell
      title="AI Workforce"
      subtitle="Not just one chatbot. Not just one AI employee. An ecosystem of helpers."
    >
      <div className="module-grid">
        {audiences.map((audience) => (
          <Link href={links[audience.id] || "/app"} className="panel audience-card" key={audience.id}>
            <h2>
              <span aria-hidden="true">{audience.emoji}</span> {audience.label}
            </h2>
            <p>{audience.blurb}</p>
            {"beachhead" in audience && audience.beachhead ? (
              <span className="badge ok">Current beachhead</span>
            ) : (
              <span className="badge">Same platform</span>
            )}
          </Link>
        ))}
      </div>

      <section className="panel">
        <h2>How it scales</h2>
        <p style={{ color: "var(--ink-soft)", maxWidth: "58ch" }}>
          Win small service businesses first with receptionist + scheduling. Then reuse the same AI
          brain, memory, voice, and marketplace for personal life managers and celebration planning.
        </p>
      </section>
    </AppShell>
  );
}
