import { AppShell } from "@/components/AppShell";
import { timelineEvents } from "@/lib/data";

export default function TimelinePage() {
  return (
    <AppShell
      title="Customer Timeline"
      subtitle="Every interaction — phone, text, email, invoices, photos, contracts, payments, reviews."
    >
      <section className="panel">
        <h2>Elena Brooks · full history</h2>
        <div className="timeline">
          {timelineEvents.map((event) => (
            <div className="timeline-item" key={event.when + event.text}>
              <div className="timeline-meta">
                <strong>{event.when}</strong>
                <span className="badge">{event.channel}</span>
              </div>
              <p>{event.text}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
