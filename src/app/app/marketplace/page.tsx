import { AppShell } from "@/components/AppShell";
import { marketplaceAssistants } from "@/lib/data";

export default function MarketplacePage() {
  return (
    <AppShell
      title="AI Marketplace"
      subtitle="Developers create assistants. Customers install the ones they need."
    >
      <div className="stat-grid">
        <div className="stat">
          <span>Assistants</span>
          <strong>{marketplaceAssistants.length}+</strong>
          <small>Seed catalog</small>
        </div>
        <div className="stat">
          <span>Categories</span>
          <strong>6</strong>
          <small>Personal → Professional</small>
        </div>
        <div className="stat">
          <span>Custom skills</span>
          <strong>Open</strong>
          <small>Developer platform</small>
        </div>
      </div>

      <section className="panel">
        <h2>Install an assistant</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Assistant</th>
              <th>Category</th>
              <th>Installs</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {marketplaceAssistants.map((item) => (
              <tr key={item.name}>
                <td>
                  <strong>{item.name}</strong>
                </td>
                <td>{item.category}</td>
                <td>{item.installs}</td>
                <td>
                  <button className="btn btn-outline" type="button">
                    Install
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppShell>
  );
}
