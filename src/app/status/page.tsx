import Link from "@/components/SiteLink";

const components = [
  { name: "App shell & Account Center", status: "operational" as const, detail: "Serving normally" },
  { name: "Command Center chat", status: "operational" as const, detail: "Keyword replies healthy" },
  { name: "Local account vault", status: "operational" as const, detail: "Browser storage OK" },
  { name: "Sync across devices", status: "degraded" as const, detail: "Demo sync only — no multi-device cloud yet" },
  { name: "Email / SMS notifications", status: "maintenance" as const, detail: "Prototype toggles only" },
  { name: "Billing provider", status: "operational" as const, detail: "Local plan simulation" },
];

export default function StatusPage() {
  return (
    <div className="auth-page">
      <div className="container auth-wrap" style={{ maxWidth: "46rem" }}>
        <div className="auth-brand">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>System status</h1>
          <p>Outage and component health for the Atlas AI prototype.</p>
        </div>

        <section className="panel">
          <div className="status-banner ok">All core prototype systems are reachable.</div>
          <ul className="manage-list">
            {components.map((item) => (
              <li key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.detail}</small>
                </div>
                <span className={`status-pill ${item.status}`}>{item.status}</span>
              </li>
            ))}
          </ul>
          <p className="account-hint">
            <Link href="/app/account">Back to Account Center</Link> ·{" "}
            <Link href="/">Home</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
