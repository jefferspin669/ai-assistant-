import { AppShell } from "@/components/AppShell";
import { payments } from "@/lib/data";

export default function PaymentsPage() {
  return (
    <AppShell
      title="Payments"
      subtitle="Cards, ACH, deposits, payment plans, and automatic invoices."
    >
      <div className="stat-grid">
        {["Credit cards", "ACH", "Deposits", "Payment plans", "Auto invoices"].map((method) => (
          <div className="stat" key={method}>
            <span>Accepted</span>
            <strong style={{ fontSize: "1.15rem" }}>{method}</strong>
            <small>Ready</small>
          </div>
        ))}
      </div>

      <section className="panel">
        <h2>Recent payments</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.customer + p.amount}>
                <td>
                  <strong>{p.customer}</strong>
                </td>
                <td>{p.amount}</td>
                <td>{p.method}</td>
                <td>
                  <span className={p.status === "Paid" ? "badge ok" : "badge warn"}>{p.status}</span>
                </td>
                <td>{p.when}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
