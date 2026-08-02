"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { atlasApi } from "@/lib/api/atlas-api";
import { DB_TABLES } from "@/lib/db/schema";

type Arch = {
  frontend: string[];
  backendApi: string[];
  database: string[];
  stats: Record<string, number>;
};

export function ArchitectureStudio() {
  const [arch, setArch] = useState<Arch | null>(null);
  const [health, setHealth] = useState("");
  const [flash, setFlash] = useState("");

  function refresh() {
    const result = atlasApi.meta.architecture();
    if (result.ok) setArch(result.data);
    const h = atlasApi.meta.health();
    if (h.ok) setHealth(`${h.data.engine} · ${h.data.tables} tables · ${h.data.status}`);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AppShell
      title="Atlas Architecture"
      subtitle="Frontend · Backend API · Database — the product shape for the first usable Atlas."
    >
      {flash ? (
        <p className={flash.toLowerCase().includes("fail") ? "auth-error" : "auth-success"}>{flash}</p>
      ) : null}
      <p className="account-hint">{health || "Loading vault…"}</p>

      <div className="arch-tree">
        <section className="panel arch-root">
          <p className="briefing-kicker">Atlas</p>
          <h2>Three layers</h2>
          <div className="arch-columns">
            <div className="arch-col">
              <h3>Frontend</h3>
              <ul>
                {(arch?.frontend || ["Dashboard", "Calendar", "Tax Center", "AI Chat", "Files", "Settings"]).map(
                  (item) => (
                    <li key={item}>{item}</li>
                  ),
                )}
              </ul>
            </div>
            <div className="arch-col">
              <h3>Backend API</h3>
              <ul>
                {(
                  arch?.backendApi || [
                    "Authentication",
                    "Users",
                    "Businesses",
                    "Calendar",
                    "Tasks",
                    "Transactions",
                    "Taxes",
                    "AI",
                    "Notifications",
                    "Files",
                    "Billing",
                  ]
                ).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="arch-col">
              <h3>Database</h3>
              <ul>
                {(arch?.database || [...DB_TABLES]).map((item) => (
                  <li key={item}>
                    {item}
                    {arch?.stats?.[item] != null ? <em>{arch.stats[item]}</em> : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="cta-row" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                try {
                  const result = atlasApi.meta.reset();
                  if (result.ok) {
                    setFlash("Database re-seeded from calendar, tasks, and tax ledger.");
                    refresh();
                  } else {
                    setFlash(result.error);
                  }
                } catch (error) {
                  setFlash(error instanceof Error ? error.message : "Re-seed failed.");
                }
              }}
            >
              Re-seed database
            </button>
            <button type="button" className="btn btn-outline" onClick={refresh}>
              Refresh stats
            </button>
          </div>
        </section>

        <div className="split">
          <section className="panel">
            <h2>users</h2>
            <p className="panel-lead">Primary identity table (passwords live in user_credentials).</p>
            <ul className="manage-list">
              {[
                "id",
                "email",
                "full_name",
                "profile_image",
                "timezone",
                "preferred_language",
                "created_at",
                "updated_at",
              ].map((column) => (
                <li key={column}>
                  <div>
                    <strong>{column}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>organizations</h2>
            <p className="panel-lead">Business workspace owned by a users.id.</p>
            <ul className="manage-list">
              {[
                "id",
                "owner_id",
                "business_name",
                "logo_url",
                "business_type",
                "tax_structure",
                "state",
                "created_at",
              ].map((column) => (
                <li key={column}>
                  <div>
                    <strong>{column}</strong>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="panel">
          <h2>organization_members</h2>
          <p className="panel-lead">Membership join table — role and status per user in an org.</p>
          <ul className="manage-list">
            {["id", "organization_id", "user_id", "role", "status", "joined_at"].map((column) => (
              <li key={column}>
                <div>
                  <strong>{column}</strong>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>HTTP API</h2>
          <p className="panel-lead">
            REST façade at <code>/api/atlas/*</code> — use the client API for durable browser state.
          </p>
          <ul className="manage-list">
            {[
              "GET /api/atlas/meta/health",
              "GET /api/atlas/meta/architecture",
              "GET /api/atlas/users",
              "GET /api/atlas/calendar",
              "GET /api/atlas/tasks",
              "GET /api/atlas/transactions",
              "GET /api/atlas/taxes/estimate",
              "POST /api/atlas/ai/chat",
              "GET /api/atlas/files",
              "GET /api/atlas/billing",
            ].map((route) => (
              <li key={route}>
                <div>
                  <strong>{route}</strong>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
