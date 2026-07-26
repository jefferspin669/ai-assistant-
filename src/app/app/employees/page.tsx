import { AppShell } from "@/components/AppShell";
import { aiEmployees, customEmployee } from "@/lib/data";

export default function EmployeesPage() {
  return (
    <AppShell
      title="AI Employees"
      subtitle="Every business creates their own AI employee — then specializes the staff behind it."
    >
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Your AI employee</p>
          <h2>
            Meet {customEmployee.name}
          </h2>
          <p style={{ color: "var(--ink-soft)" }}>
            {customEmployee.role} · {customEmployee.personality} ·{" "}
            {customEmployee.languages.join(" / ")}
          </p>
        </div>
        <ul className="plain-list">
          <li>Knows pricing, policies, services, employees, inventory, FAQs</li>
          <li>Learns every week from calls, jobs, and outcomes</li>
          <li>Never forgets a customer preference</li>
        </ul>
      </section>

      <div className="employee-grid">
        {aiEmployees.map((employee) => (
          <article className="panel employee-card" key={employee.id}>
            <div className="employee-card-top">
              <span className="employee-emoji" aria-hidden="true">
                {employee.emoji}
              </span>
              <div>
                <h2>{employee.name}</h2>
                <p>
                  {employee.role} · <span className="badge ok">{employee.status}</span>
                </p>
              </div>
            </div>
            <h3>Duties</h3>
            <ul className="plain-list">
              {employee.duties.map((duty) => (
                <li key={duty}>{duty}</li>
              ))}
            </ul>
            <h3>Acts automatically</h3>
            <ul className="plain-list">
              {employee.canAuto.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>Asks first</h3>
            <ul className="plain-list confirm-list">
              {employee.needsConfirm.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
