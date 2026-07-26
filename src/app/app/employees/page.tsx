import { AppShell } from "@/components/AppShell";
import { teamAi } from "@/lib/data";

export default function EmployeesPage() {
  return (
    <AppShell
      title="Team AI"
      subtitle="Businesses create multiple AI employees. You talk to Atlas — Atlas delegates."
    >
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Example · Jeff’s Plumbing</p>
          <h2>One owner. A full AI staff.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            Sarah handles reception. Mike schedules. Emma sells. David markets. Alex runs finance.
            Atlas routes every request to the right specialist.
          </p>
        </div>
        <ul className="plain-list">
          <li>Owner talks naturally to Atlas</li>
          <li>Atlas delegates to the right AI employee</li>
          <li>Each role has auto actions + confirmation rules</li>
        </ul>
      </section>

      <div className="employee-grid">
        {teamAi.map((member) => (
          <article className="panel employee-card" key={member.name}>
            <div className="employee-card-top">
              <span className="employee-emoji" aria-hidden="true">
                👤
              </span>
              <div>
                <h2>{member.name}</h2>
                <p>
                  {member.role} · <span className="badge ok">Online</span>
                </p>
              </div>
            </div>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.7rem" }}>{member.focus}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
