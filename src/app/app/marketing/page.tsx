import { AppShell } from "@/components/AppShell";
import { campaigns } from "@/lib/data";

export default function MarketingPage() {
  return (
    <AppShell
      title="Marketing Center"
      subtitle="Send promotions, holiday specials, coupons, reminders, and birthday discounts."
      action={<button className="btn btn-dark">New campaign</button>}
    >
      <section className="panel">
        <h2>Campaigns</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Reach</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.name}>
                <td>
                  <strong>{c.name}</strong>
                </td>
                <td>{c.type}</td>
                <td>
                  <span className={c.status === "Active" ? "badge ok" : "badge"}>{c.status}</span>
                </td>
                <td>{c.reach}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="stat-grid">
        {["Promotions", "Holiday specials", "Coupons", "Appointment reminders", "Birthday discounts"].map(
          (item) => (
            <div className="stat" key={item}>
              <span>Channel ready</span>
              <strong style={{ fontSize: "1.15rem" }}>{item}</strong>
              <small>SMS + email</small>
            </div>
          ),
        )}
      </div>
    </AppShell>
  );
}
