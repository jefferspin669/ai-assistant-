import { AppShell } from "@/components/AppShell";
import { digitalEmployees, teamAi } from "@/lib/data";

export default function EmployeesPage() {
  return (
    <AppShell
      title="AI Digital Employees"
      subtitle="Instead of one AI — specialized teammates that share the same business memory."
    >
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Shared business memory</p>
          <h2>Different expertise. One company brain.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            CEO, CFO, Marketing, Sales, Support, Ops, HR, IT, Compliance, and Supply Chain — each
            specialized, all aligned to your Business DNA.
          </p>
        </div>
        <ul className="plain-list">
          <li>You talk to Atlas</li>
          <li>Atlas delegates to the right digital employee</li>
          <li>Every role reads the same memory + DNA</li>
        </ul>
      </section>

      <div className="employee-grid">
        {digitalEmployees.map((employee) => (
          <article className="panel employee-card" key={employee.title}>
            <div className="employee-card-top">
              <span className="employee-emoji" aria-hidden="true">
                {employee.emoji}
              </span>
              <div>
                <h2>{employee.title}</h2>
                <p>
                  <span className="badge ok">Online</span>
                </p>
              </div>
            </div>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.7rem" }}>{employee.expertise}</p>
          </article>
        ))}
      </div>

      <section className="panel">
        <h2>Named roster example · Jeff’s Plumbing</h2>
        <div className="list">
          {teamAi.map((member) => (
            <div className="list-row" key={member.name}>
              <span className="badge">{member.role}</span>
              <p>
                <strong>{member.name}</strong> — {member.focus}
              </p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
