"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import { operatingSystemApps } from "@/lib/atlas-platform";
import {
  createOsApp,
  loadOsApps,
  saveOsApps,
  type OsApp,
} from "@/lib/surface-workspace";

export function OperatingSystemStudio() {
  const [customApps, setCustomApps] = useState<OsApp[]>([]);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [href, setHref] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCustomApps(loadOsApps());
    setReady(true);
  }, []);

  function persist(next: OsApp[]) {
    setCustomApps(next);
    saveOsApps(next);
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const app = createOsApp({ name, detail, href });
    persist([app, ...customApps]);
    setName("");
    setDetail("");
    setHref("");
    setNote(`Added “${app.name}” to your AI Operating System.`);
  }

  function removeApp(id: string) {
    persist(customApps.filter((app) => app.id !== id));
    setNote("Custom app removed.");
  }

  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">AI Operating System</p>
          <h2>Everything inside one workspace.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            Email, phone, calendar, CRM, inventory, invoices, payroll, marketing, projects,
            documents, analytics — plus anything you add.
          </p>
        </div>
        <ul className="plain-list">
          <li>One login</li>
          <li>One shared Atlas memory</li>
          <li>One AI across every app</li>
        </ul>
      </section>

      <section className="panel">
        <h2>Add to your OS</h2>
        <p className="panel-lead">Add the tools you need — they accumulate in your workspace.</p>
        <form className="form-grid" onSubmit={onAdd}>
          <label>
            App name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fleet tracker"
              required
            />
          </label>
          <label>
            Detail
            <input
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Vehicles, fuel, maintenance"
            />
          </label>
          <label>
            Link (optional)
            <input
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/app/routes"
            />
          </label>
          <button className="btn btn-dark" type="submit">
            Add app
          </button>
        </form>
        {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
      </section>

      <section className="panel">
        <h2>Your apps ({ready ? customApps.length : "…"})</h2>
        {ready && customApps.length === 0 ? (
          <p className="muted-line">No custom apps yet. Add what you need above.</p>
        ) : (
          <div className="pack-grid dense" style={{ marginTop: "0.85rem" }}>
            {customApps.map((app) => (
              <article key={app.id} className="pack-card panel" style={{ padding: "1rem" }}>
                <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>
                  {app.name}
                </strong>
                <p style={{ color: "var(--ink-soft)", marginTop: "0.35rem" }}>{app.detail}</p>
                <div className="train-actions">
                  <Link className="btn btn-outline" href={app.href}>
                    Open
                  </Link>
                  <button className="btn btn-outline" type="button" onClick={() => removeApp(app.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Built-in workspace</h2>
        <div className="pack-grid dense" style={{ marginTop: "0.85rem" }}>
          {operatingSystemApps.map((app) => (
            <Link
              key={app.name}
              href={app.href}
              className="pack-card panel"
              style={{ padding: "1rem" }}
            >
              <strong style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem" }}>
                {app.name}
              </strong>
              <p style={{ color: "var(--ink-soft)", marginTop: "0.35rem" }}>{app.detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
