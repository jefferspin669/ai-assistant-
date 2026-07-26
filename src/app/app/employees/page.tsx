import { AppShell } from "@/components/AppShell";
import { aiEmployees } from "@/lib/data";

export default function EmployeesPage() {
  return (
    <AppShell
      title="AI Employees"
      subtitle="You talk to one assistant. Behind the scenes, specialists handle their jobs."
    >
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

      <section className="panel">
        <h2>Oversight model</h2>
        <p style={{ color: "var(--ink-soft)", maxWidth: "54ch" }}>
          Routine work — reminders, common FAQs, review requests — runs automatically. High-impact
          actions like refunds, price changes, mass marketing, or reshaping a full day of jobs wait
          for your confirmation.
        </p>
      </section>
    </AppShell>
  );
}
