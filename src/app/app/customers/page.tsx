import { AppShell } from "@/components/AppShell";
import { customers } from "@/lib/data";

export default function CustomersPage() {
  return (
    <AppShell title="Customer CRM" subtitle="Every customer profile stores the full job history.">
      <div className="split">
        <section className="panel">
          <h2>Customers</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Jobs</th>
                <th>Value</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone}>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem" }}>
                      {c.phone} · {c.email}
                    </div>
                  </td>
                  <td>{c.jobs}</td>
                  <td>{c.value}</td>
                  <td>{c.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Profile · Jamie Cole</h2>
          <div className="list">
            {[
              "Call history — 6 calls, 2 transferred",
              "Messages — quote + reminder thread",
              "Quotes — water heater replace signed",
              "Jobs — 4 completed",
              "Payments — $2,140 lifetime",
              "Photos — 8 job site images",
              "Notes — prefers morning windows",
            ].map((item) => (
              <div className="list-row" key={item}>
                <span className="badge">Stored</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
