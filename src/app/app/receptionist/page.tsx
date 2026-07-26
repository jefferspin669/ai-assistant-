import { AppShell } from "@/components/AppShell";

export default function ReceptionistPage() {
  return (
    <AppShell
      title="Receptionist"
      subtitle="Not voicemail — real conversations that book jobs overnight."
    >
      <div className="split">
        <section className="panel">
          <h2>Live call</h2>
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
              Booked. Photos collected, address saved, customer profile created, estimate drafted,
              technician scheduled, confirmation sent.
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Overnight outcomes</h2>
          <div className="list">
            {[
              "Answer questions",
              "Book appointments",
              "Transfer emergencies",
              "Collect customer information",
              "Collect photos + address",
              "Create estimate + schedule tech",
            ].map((item) => (
              <div className="list-row" key={item}>
                <span className="badge ok">On</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
