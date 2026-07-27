"use client";

import { useMemo, useState } from "react";
import { marketplaceAssistants } from "@/lib/data";
import { marketplaceShareTypes, marketplaceShares } from "@/lib/atlas-platform";

type Mode = "shares" | "assistants" | "sell";

const modes: { id: Mode; label: string }[] = [
  { id: "shares", label: "Sell & share" },
  { id: "assistants", label: "Assistants" },
  { id: "sell", label: "Publish yours" },
];

export function MarketplaceStudio() {
  const [mode, setMode] = useState<Mode>("shares");
  const [typeFilter, setTypeFilter] = useState<(typeof marketplaceShareTypes)[number]>("All");
  const [selectedId, setSelectedId] = useState<string>(marketplaceShares[0].id);
  const [owned, setOwned] = useState<Record<string, boolean>>({ "missed-call": true });
  const [note, setNote] = useState<string | null>(null);
  const [publishName, setPublishName] = useState("");
  const [publishType, setPublishType] = useState("Workflows");

  const filtered = useMemo(
    () =>
      typeFilter === "All"
        ? marketplaceShares
        : marketplaceShares.filter((item) => item.type === typeFilter),
    [typeFilter],
  );

  const selected = marketplaceShares.find((item) => item.id === selectedId) ?? marketplaceShares[0];

  function toggleOwn(id: string, name: string) {
    setOwned((prev) => {
      const next = !prev[id];
      setNote(next ? `Added “${name}” to your business.` : `Removed “${name}”.`);
      return { ...prev, [id]: next };
    });
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Shared packs</span>
          <strong>{marketplaceShares.length}</strong>
          <small>Workflows to courses</small>
        </div>
        <div className="stat">
          <span>Assistants</span>
          <strong>{marketplaceAssistants.length}</strong>
          <small>Installable AI roles</small>
        </div>
        <div className="stat">
          <span>In your library</span>
          <strong>{Object.values(owned).filter(Boolean).length}</strong>
          <small>Installed / purchased</small>
        </div>
        <div className="stat">
          <span>Model</span>
          <strong>Sell & share</strong>
          <small>Business to business</small>
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

      {mode === "shares" ? (
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
              <h2>Marketplace packs</h2>
              <p className="panel-lead">
                Sell and share workflows, AI prompts, dashboards, industry templates, automation
                packs, reports, and training courses.
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
                      {owned[item.id] ? "Owned" : item.price}
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
                    {selected.price} · by {selected.seller}
                  </p>
                </div>
              </div>
              <div className="train-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => toggleOwn(selected.id, selected.name)}
                >
                  {owned[selected.id] ? "Remove" : selected.price === "Free" ? "Install" : "Buy & install"}
                </button>
              </div>
              {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
            </section>
          </div>
        </>
      ) : null}

      {mode === "assistants" ? (
        <section className="panel">
          <h2>Installable assistants</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Assistant</th>
                <th>Category</th>
                <th>Installs</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {mode === "sell" ? (
        <section className="panel">
          <h2>Publish to the marketplace</h2>
          <p className="panel-lead">Share what works for your business — workflows, prompts, packs, and courses.</p>
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
              Name
              <input
                value={publishName}
                onChange={(e) => setPublishName(e.target.value)}
                placeholder="My missed-call workflow"
                required
              />
            </label>
            <label>
              Type
              <select value={publishType} onChange={(e) => setPublishType(e.target.value)}>
                {marketplaceShareTypes.filter((type) => type !== "All").map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <button className="btn btn-dark" type="submit">
              Submit for review
            </button>
          </form>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
