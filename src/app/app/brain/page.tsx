import { AppShell } from "@/components/AppShell";
import { memoryFacts } from "@/lib/data";

export default function BrainPage() {
  return (
    <AppShell
      title="AI Brain"
      subtitle="Not just a chatbot — a real business assistant that understands text, voice, PDFs, invoices, and photos."
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
          <h2>AI Memory · Elena Brooks</h2>
          <p style={{ color: "var(--ink-soft)", marginBottom: "0.8rem" }}>
            Customer called 9 months ago? Prefers mornings? Has three dogs? Always requests John?
            Atlas remembers.
          </p>
          <ul className="plain-list">
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
