import { AppShell } from "@/components/AppShell";
import { memoryFacts } from "@/lib/data";

export default function BrainPage() {
  return (
    <AppShell
      title="AI Memory"
      subtitle="Each AI learns about its owner over time — with permission — so you don’t repeat yourself."
    >
      <div className="split">
        <section className="panel">
          <h2>Atlas understands</h2>
          <div className="list">
            {[
              "Type a question — Atlas answers",
              "Speak while driving — Atlas answers",
              "Upload a PDF — Atlas understands",
              "Upload an invoice — Atlas categorizes it",
              "Upload a photo — Atlas recognizes the equipment",
            ].map((item) => (
              <div className="list-row" key={item}>
                <span className="badge ok">Ready</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Learns with permission</h2>
          <div className="list">
            {[
              "Preferred communication style",
              "Business hours",
              "Common customers",
              "Recurring tasks",
              "Frequently used templates",
            ].map((item) => (
              <div className="list-row" key={item}>
                <span className="badge">Memory</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: "1rem" }}>Example · Elena Brooks</h3>
          <ul className="plain-list" style={{ marginTop: "0.45rem" }}>
            {memoryFacts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel">
        <h2>Overnight brain loop</h2>
        <div className="chat-mock">
          <div className="bubble bubble-user">My AC stopped working.</div>
          <div className="bubble bubble-ai">
            I’m sorry to hear that. Is the unit completely off, or is it blowing warm air?
          </div>
          <div className="bubble bubble-user">It’s blowing warm.</div>
          <div className="bubble bubble-ai">
            I can have someone there tomorrow between 10 and 12. Would that work?
          </div>
          <div className="bubble bubble-ai">
            Booked. Photos collected, address saved, profile created, estimate drafted, technician
            scheduled, confirmation sent. Jeff will see a new customer in the morning.
          </div>
        </div>
      </section>
    </AppShell>
  );
}
