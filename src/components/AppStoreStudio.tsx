"use client";

import { useMemo, useState } from "react";
import { appStoreCategories, appStoreModules } from "@/lib/atlas-platform";

export function AppStoreStudio() {
  const [category, setCategory] = useState<(typeof appStoreCategories)[number]>("All");
  const [installed, setInstalled] = useState<Record<string, boolean>>({ hvac: true });
  const [selectedId, setSelectedId] = useState<string>(appStoreModules[0].id);
  const [note, setNote] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      category === "All"
        ? appStoreModules
        : appStoreModules.filter((mod) => mod.category === category),
    [category],
  );

  const selected = appStoreModules.find((mod) => mod.id === selectedId) ?? appStoreModules[0];
  const installedCount = Object.values(installed).filter(Boolean).length;

  function toggleInstall(id: string, name: string) {
    setInstalled((prev) => {
      const next = !prev[id];
      setNote(next ? `Installed “${name}”.` : `Removed “${name}”.`);
      return { ...prev, [id]: next };
    });
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Modules</span>
          <strong>{appStoreModules.length}</strong>
          <small>Published</small>
        </div>
        <div className="stat">
          <span>Installed</span>
          <strong>{installedCount}</strong>
          <small>On this business</small>
        </div>
        <div className="stat">
          <span>Categories</span>
          <strong>{appStoreCategories.length - 1}</strong>
          <small>Trades to personal</small>
        </div>
        <div className="stat">
          <span>Model</span>
          <strong>Pick & run</strong>
          <small>Install only what you need</small>
        </div>
      </div>

      <div className="quality-filter-row">
        {appStoreCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={category === cat ? "training-tab active" : "training-tab"}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="split">
        <section className="panel">
          <h2>Atlas App Store</h2>
          <p className="panel-lead">
            Third-party developers publish modules. Businesses install only what they need.
          </p>
          <div className="pack-grid">
            {filtered.map((mod) => (
              <button
                key={mod.id}
                type="button"
                className={selectedId === mod.id ? "store-card active" : "store-card"}
                onClick={() => setSelectedId(mod.id)}
              >
                <div className="train-head">
                  <h3 style={{ marginBottom: 0 }}>{mod.name}</h3>
                  <span className={`badge${installed[mod.id] ? " ok" : ""}`}>
                    {installed[mod.id] ? "Installed" : mod.category}
                  </span>
                </div>
                <p className="panel-lead" style={{ marginBottom: "0.55rem" }}>
                  {mod.blurb}
                </p>
                <small className="muted-line">{mod.installs} installs</small>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{selected.name}</h2>
          <div className="list">
            <div className="list-row">
              <span className="badge">{selected.category}</span>
              <p>{selected.blurb}</p>
            </div>
            <div className="list-row">
              <span className="badge ok">{selected.installs}</span>
              <p>Community installs</p>
            </div>
          </div>
          <div className="memory-card" style={{ marginTop: "1rem" }}>
            <div className="label">Includes</div>
            <p>
              Industry workflows, prompts, and dashboards that plug into Atlas Brain, phone, and
              Employee Hub.
            </p>
          </div>
          <div className="train-actions">
            <button
              className="btn btn-dark"
              type="button"
              onClick={() => toggleInstall(selected.id, selected.name)}
            >
              {installed[selected.id] ? "Uninstall" : "Install"}
            </button>
          </div>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      </div>
    </div>
  );
}
