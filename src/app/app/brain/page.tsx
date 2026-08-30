import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";
import { brainDomains, memoryReplay } from "@/lib/atlas-platform";

export default function BrainPage() {
  return (
    <AppShell
      title="Atlas Brain"
      subtitle="The central AI that knows everything — instead of every AI starting over, Atlas remembers."
    >
      <section className="panel">
        <h2>What Atlas remembers</h2>
        <p className="panel-lead">
          Customers, employees, hours, services, inventory, appointments, conversations, policies,
          pricing, documents, past jobs, equipment, and suppliers — one living business brain.
        </p>
        <div className="domain-grid">
          {brainDomains.map((domain) => (
            <div className="domain-card" key={domain.label}>
              <strong>{domain.label}</strong>
              <span>{domain.detail}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Memory that compounds</h2>
          <div className="memory-card">
            <div>
              <div className="label">{memoryReplay.monthsAgo}</div>
              <p>
                <strong>Customer:</strong> {memoryReplay.past}
              </p>
            </div>
            <div>
              <div className="label">Today</div>
              <p>
                <strong>Customer:</strong> {memoryReplay.now}
              </p>
            </div>
            <div className="chat-mock" style={{ margin: 0 }}>
              <div className="bubble bubble-ai">{memoryReplay.atlas}</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Connected surfaces</h2>
          <div className="list">
            {[
              { href: "/app/memory", label: "AI Memory", text: "Preferences that follow every customer" },
              { href: "/app/knowledge", label: "Knowledge Base", text: "PDFs, manuals, policies, media" },
              { href: "/app/phone", label: "Phone System", text: "Answers, routes, books, pays" },
              { href: "/app/score", label: "Intelligence Score", text: "Business health from 0–100" },
              { href: "/app/digital-twin", label: "Digital Twin", text: "Simulate before you decide" },
              { href: "/app/workflows", label: "Workflow Builder", text: "Automations with no code" },
            ].map((item) => (
              <div className="list-row" key={item.href}>
                <span className="badge ok">Open</span>
                <p>
                  <Link href={item.href}>
                    <strong>{item.label}</strong>
                  </Link>
                  <span className="muted-line">{item.text}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>Overnight brain loop</h2>
        <div className="chat-mock">
          <div className="bubble bubble-user">My AC quit working.</div>
          <div className="bubble bubble-ai">
            I’m sorry to hear that. Would you like the earliest technician available?
          </div>
          <div className="bubble bubble-user">Yes — mornings if possible.</div>
          <div className="bubble bubble-ai">
            Booked. Photos collected, address saved, profile created, estimate drafted, technician
            scheduled, confirmation sent. Jeff will see a new customer in the morning — and Atlas
            already remembers they prefer mornings.
          </div>
        </div>
      </section>
    </AppShell>
  );
}
