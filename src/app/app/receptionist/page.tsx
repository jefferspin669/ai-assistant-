import { AppShell } from "@/components/AppShell";

export default function ReceptionistPage() {
  return (
    <AppShell
      title="AI Receptionist"
      subtitle="Instead of voicemail — a front desk that answers, books, and texts."
    >
      <div className="split">
        <section className="panel">
          <h2>Live call script</h2>
          <div className="chat-mock">
            <div className="bubble bubble-ai">
              Hello! Thanks for calling Smith Plumbing. How can I help you today?
            </div>
            <div className="bubble bubble-user">My water heater is out and I need someone today.</div>
            <div className="bubble bubble-ai">
              I can book a same-day visit at 4:30 PM with Sam, or transfer you now if this is urgent.
              What’s the address and best callback number?
            </div>
            <div className="bubble bubble-user">90 Cedar Ct, 555-771-9034.</div>
            <div className="bubble bubble-ai">
              Booked. I’m texting confirmation now and will send a reminder an hour before arrival.
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>What Sarah can do</h2>
          <div className="list">
            {[
              "Answer questions about services and hours",
              "Book appointments on the calendar",
              "Transfer urgent calls to you",
              "Collect customer information",
              "Send text messages during the call flow",
              "Schedule callbacks when you’re busy",
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
