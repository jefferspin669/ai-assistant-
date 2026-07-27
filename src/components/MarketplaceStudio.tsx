"use client";

import { useMemo, useState } from "react";
import { marketplaceShareTypes, marketplaceShares } from "@/lib/atlas-platform";

type Mode = "browse" | "installed" | "publish";

const modes: { id: Mode; label: string }[] = [
  { id: "browse", label: "Browse & install" },
  { id: "installed", label: "Your library" },
  { id: "publish", label: "Publish as developer" },
];

export function MarketplaceStudio() {
  const [mode, setMode] = useState<Mode>("browse");
  const [typeFilter, setTypeFilter] = useState<(typeof marketplaceShareTypes)[number]>("All");
  const [selectedId, setSelectedId] = useState<string>(marketplaceShares[0].id);
  const [owned, setOwned] = useState<Record<string, boolean>>({ "missed-call": true, "hvac-agent": true });
  const [note, setNote] = useState<string | null>(null);
  const [publishName, setPublishName] = useState("");
  const [publishType, setPublishType] = useState("Industry agents");

  const filtered = useMemo(
    () =>
      typeFilter === "All"
        ? marketplaceShares
        : marketplaceShares.filter((item) => item.type === typeFilter),
    [typeFilter],
  );

  const selected = marketplaceShares.find((item) => item.id === selectedId) ?? marketplaceShares[0];
  const installedItems = marketplaceShares.filter((item) => owned[item.id]);

  function toggleOwn(id: string, name: string) {
    setOwned((prev) => {
      const next = !prev[id];
      setNote(next ? `Installed “${name}” on this business.` : `Removed “${name}”.`);
      return { ...prev, [id]: next };
    });
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Listings</span>
          <strong>{marketplaceShares.length}</strong>
          <small>From developers</small>
        </div>
        <div className="stat">
          <span>Categories</span>
          <strong>{marketplaceShareTypes.length - 1}</strong>
          <small>Agents to templates</small>
        </div>
        <div className="stat">
          <span>Installed</span>
          <strong>{Object.values(owned).filter(Boolean).length}</strong>
          <small>On this business</small>
        </div>
        <div className="stat">
          <span>Model</span>
          <strong>Create · install</strong>
          <small>Only what you need</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Marketplace modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "browse" ? (
        <>
          <div className="quality-filter-row">
            {marketplaceShareTypes.map((type) => (
              <button
                key={type}
                type="button"
                className={typeFilter === type ? "training-tab active" : "training-tab"}
                onClick={() => setTypeFilter(type)}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="split">
            <section className="panel">
              <h2>AI Marketplace</h2>
              <p className="panel-lead">
                Developers publish industry agents, dashboards, automations, reports, integrations,
                and templates. Businesses install what they need.
              </p>
              <div className="list">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={selectedId === item.id ? "compliance-row active" : "compliance-row"}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className={`badge${owned[item.id] ? " ok" : ""}`}>
                      {owned[item.id] ? "Installed" : item.price}
                    </span>
                    <div>
                      <p>
                        <strong>{item.name}</strong>
                      </p>
                      <small className="muted-line">
                        {item.type} · ★ {item.rating} · {item.seller}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            </section>
            <section className="panel">
              <h2>{selected.name}</h2>
              <div className="list">
                <div className="list-row">
                  <span className="badge">{selected.type}</span>
                  <p>{selected.blurb}</p>
                </div>
                <div className="list-row">
                  <span className="badge ok">★ {selected.rating}</span>
                  <p>
                    {selected.price} · by {selected.seller} ({selected.developer})
                  </p>
                </div>
              </div>
              <div className="train-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => toggleOwn(selected.id, selected.name)}
                >
                  {owned[selected.id]
                    ? "Uninstall"
                    : selected.price === "Free"
                      ? "Install"
                      : "Buy & install"}
                </button>
              </div>
              {note ? (
                <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                  {note}
                </p>
              ) : null}
            </section>
          </div>
        </>
      ) : null}

      {mode === "installed" ? (
        <section className="panel">
          <h2>Installed on this business</h2>
          <p className="panel-lead">Only the pieces you chose — agents, dashboards, automations, and more.</p>
          {installedItems.length === 0 ? (
            <p className="muted-line">Nothing installed yet. Browse the marketplace to add packs.</p>
          ) : (
            <div className="list" style={{ marginTop: "0.85rem" }}>
              {installedItems.map((item) => (
                <div className="list-row" key={item.id}>
                  <span className="badge ok">{item.type}</span>
                  <div>
                    <p>
                      <strong>{item.name}</strong>
                    </p>
                    <small className="muted-line">{item.blurb}</small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => toggleOwn(item.id, item.name)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {note ? (
            <p className="muted-line" style={{ marginTop: "0.85rem" }}>
              {note}
            </p>
          ) : null}
        </section>
      ) : null}

      {mode === "publish" ? (
        <section className="panel">
          <h2>Publish as a developer</h2>
          <p className="panel-lead">
            Ship industry agents, dashboards, automations, reports, integrations, or templates for
            businesses to install.
          </p>
          <form
            className="hub-pto-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!publishName.trim()) return;
              setNote(`Submitted “${publishName.trim()}” (${publishType}) for marketplace review.`);
              setPublishName("");
            }}
          >
            <label>
              Listing name
              <input
                value={publishName}
                onChange={(e) => setPublishName(e.target.value)}
                placeholder="HVAC overnight receptionist"
                required
              />
            </label>
            <label>
              Type
              <select value={publishType} onChange={(e) => setPublishType(e.target.value)}>
                {marketplaceShareTypes
                  .filter((type) => type !== "All")
                  .map((type) => (
                    <option key={type}>{type}</option>
                  ))}
              </select>
            </label>
            <button className="btn btn-dark" type="submit">
              Submit for review
            </button>
          </form>
          {note ? (
            <p className="muted-line" style={{ marginTop: "0.85rem" }}>
              {note}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
