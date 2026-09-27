"use client";

type Message = { id: string; body: string; at: string; from: string };

/** Extracted messages surface for the employee portal (lazy-loaded). */
export function EmployeeMessagesPanel({
  messages,
}: {
  messages: Message[];
}) {
  if (!messages.length) {
    return <p className="muted-line">No messages yet.</p>;
  }
  return (
    <div className="list">
      {messages.slice(0, 40).map((m) => (
        <div className="list-row" key={m.id}>
          <div>
            <p>
              <strong>{m.from}</strong>
            </p>
            <small className="muted-line">{m.at}</small>
            <p>{m.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
