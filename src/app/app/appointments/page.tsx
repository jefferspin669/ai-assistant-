import { AppShell } from "@/components/AppShell";
import { appointments } from "@/lib/data";

export default function AppointmentsPage() {
  return (
    <AppShell
      title="Appointment System"
      subtitle="Calendar with staff schedules, reminders, rescheduling, and no-show tracking."
      action={<button className="btn btn-dark">Sync Google Calendar</button>}
    >
      <div className="split">
        <section className="panel">
          <h2>Today · drag-and-drop board</h2>
          <div className="calendar">
            {appointments.map((appt) => (
              <div className="cal-slot" key={appt.time + appt.customer} draggable>
                <strong>{appt.time}</strong>
                <div>
                  <div>{appt.customer}</div>
                  <div style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                    {appt.job} · {appt.staff}
                  </div>
                </div>
                <span className="badge">{appt.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Automation</h2>
          <div className="list">
            {[
              "Automatic reminders by text",
              "Customer self-reschedule link",
              "No-show tracking + recovery outreach",
              "Staff schedule conflict checks",
              "Google Calendar two-way sync",
            ].map((item) => (
              <div className="list-row" key={item}>
                <span className="badge ok">Active</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
