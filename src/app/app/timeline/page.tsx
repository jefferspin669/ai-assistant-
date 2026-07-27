import { FeatureView } from "@/components/FeatureView";
import { timelineEvents } from "@/lib/data";

export default function TimelinePage() {
  return (
    <FeatureView
      title="Customer Timeline"
      subtitle="Calls, texts, emails, invoices, appointments, payments, reviews, photos, and notes — one timeline."
      sections={[
        {
          type: "custom",
          node: (
            <section className="panel">
              <h2>Elena Brooks</h2>
              <div className="timeline">
                {timelineEvents.map((event) => (
                  <div className="timeline-item" key={event.when + event.text}>
                    <div className="time">{event.when}</div>
                    <span className="badge">{event.channel}</span>
                    <p>{event.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ),
        },
        {
          type: "panel",
          title: "Everything in one place",
          list: [
            { badge: "Calls", text: "Answered, missed, transferred" },
            { badge: "Messages", text: "SMS and email threads" },
            { badge: "Money", text: "Quotes, invoices, payments" },
            { badge: "Jobs", text: "Appointments, photos, notes, reviews" },
          ],
        },
      ]}
    />
  );
}
