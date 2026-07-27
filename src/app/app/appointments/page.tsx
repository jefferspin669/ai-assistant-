import { FeatureView } from "@/components/FeatureView";
import { smartCalendarSignals } from "@/lib/atlas-platform";
import { appointments } from "@/lib/data";

export default function AppointmentsPage() {
  return (
    <FeatureView
      title="Smart Calendar"
      subtitle="Not just appointments — employee schedules, holidays, equipment, travel time, traffic, weather, and job length."
      action={<button className="btn btn-dark">Sync Google Calendar</button>}
      sections={[
        {
          type: "custom",
          node: (
            <div className="split">
              <section className="panel">
                <h2>Today</h2>
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
                <h2>Understands</h2>
                <div className="list">
                  {smartCalendarSignals.map((item) => (
                    <div className="list-row" key={item}>
                      <span className="badge ok">Aware</span>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ),
        },
      ]}
    />
  );
}
