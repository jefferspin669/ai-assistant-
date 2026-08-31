"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createStoreModule,
  loadInstalledModules,
  loadStoreModules,
  saveInstalledModules,
  saveStoreModules,
  type StoreModule,
} from "@/lib/user-workspace";

const categories = ["All", "Trades", "Professional", "Healthcare", "Hospitality", "Ops", "Personal"] as const;

export function AppStoreStudio() {
  const [modules, setModules] = useState<StoreModule[]>([]);
  const [installed, setInstalled] = useState<Record<string, boolean>>({});
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [modCategory, setModCategory] = useState<string>("Ops");
  const [blurb, setBlurb] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadStoreModules();
    const installedMap = loadInstalledModules();
    setModules(loaded);
    setInstalled(installedMap);
    setSelectedId(loaded[0]?.id ?? null);
    setReady(true);
  }, []);

  const filtered = useMemo(
    () =>
      category === "All" ? modules : modules.filter((mod) => mod.category === category),
    [category, modules],
  );

  const selected = modules.find((mod) => mod.id === selectedId) ?? null;
  const installedCount = Object.values(installed).filter(Boolean).length;

  function persistModules(next: StoreModule[]) {
    setModules(next);
    saveStoreModules(next);
  }

  function persistInstalled(next: Record<string, boolean>) {
    setInstalled(next);
    saveInstalledModules(next);
  }

  function onPublish(e: FormEvent) {
    e.preventDefault();
    const mod = createStoreModule({ name, category: modCategory, blurb });
    const next = [mod, ...modules];
    persistModules(next);
    persistInstalled({ ...installed, [mod.id]: true });
    setSelectedId(mod.id);
    setName("");
    setBlurb("");
    setNote(`Published “${mod.name}” — it now appears in your store.`);
  }

  function toggleInstall(id: string, modName: string) {
    const next = { ...installed, [id]: !installed[id] };
    persistInstalled(next);
    setNote(next[id] ? `Installed “${modName}”.` : `Removed “${modName}”.`);
  }

  function removeModule(id: string) {
    const next = modules.filter((mod) => mod.id !== id);
    persistModules(next);
    const nextInstalled = { ...installed };
    delete nextInstalled[id];
    persistInstalled(nextInstalled);
    setSelectedId(next[0]?.id ?? null);
    setNote("Module removed from the store.");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Modules</span>
          <strong>{modules.length}</strong>
          <small>You published</small>
        </div>
        <div className="stat">
          <span>Installed</span>
          <strong>{installedCount}</strong>
          <small>On this business</small>
        </div>
        <div className="stat">
          <span>Categories</span>
          <strong>{categories.length - 1}</strong>
          <small>Trades to personal</small>
        </div>
        <div className="stat">
          <span>Model</span>
          <strong>Add & grow</strong>
          <small>Starts empty</small>
        </div>
      </div>

      <section className="panel">
        <h2>Publish a module</h2>
        <p className="panel-lead">
          The store starts empty. Add modules here — they accumulate as you publish.
        </p>
        <form className="form-grid" onSubmit={onPublish}>
          <label>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="HVAC capacitor math"
              required
            />
          </label>
          <label>
            Category
            <select value={modCategory} onChange={(e) => setModCategory(e.target.value)}>
              {categories
                .filter((cat) => cat !== "All")
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Description
            <input
              value={blurb}
              onChange={(e) => setBlurb(e.target.value)}
              placeholder="What this module does…"
            />
          </label>
          <button className="btn btn-dark" type="submit">
            Publish module
          </button>
        </form>
      </section>

      <div className="quality-filter-row">
        {categories.map((cat) => (
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
          <h2>Workspace modules</h2>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && filtered.length === 0 ? (
            <p className="muted-line">
              Nothing published yet. Use the form above to add your first module.
            </p>
          ) : (
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
          )}
        </section>

        <section className="panel">
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <div className="list">
                <div className="list-row">
                  <span className="badge">{selected.category}</span>
                  <p>{selected.blurb}</p>
                </div>
                <div className="list-row">
                  <span className="badge ok">{selected.installs}</span>
                  <p>Installs on this business</p>
                </div>
              </div>
              <div className="train-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => toggleInstall(selected.id, selected.name)}
                >
                  {installed[selected.id] ? "Uninstall" : "Install"}
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => removeModule(selected.id)}
                >
                  Remove from store
                </button>
              </div>
            </>
          ) : (
            <p className="muted-line">Select or publish a module to manage it here.</p>
          )}
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      </div>
    </div>
  );
}
