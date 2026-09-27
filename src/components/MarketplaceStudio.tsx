"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppStoreStudio } from "@/components/AppStoreStudio";
import { marketplaceShareTypes, marketplaceShares } from "@/lib/atlas-platform";

const TABS = [
  { id: "discover", label: "Discover" },
  { id: "installed", label: "Installed" },
  { id: "agents", label: "AI Agents" },
  { id: "integrations", label: "Integrations" },
  { id: "workflows", label: "Workflows" },
  { id: "industry-packs", label: "Industry Packs" },
  { id: "automations", label: "Automations" },
  { id: "templates", label: "Templates" },
  { id: "developer", label: "Developer" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const TAB_TYPE: Partial<Record<TabId, (typeof marketplaceShareTypes)[number]>> = {
  agents: "Industry agents",
  workflows: "Workflows",
  "industry-packs": "Industry packs",
  automations: "Automations",
  integrations: "Integrations",
  templates: "Templates",
};

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function MarketplaceStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "discover";
  const [selectedId, setSelectedId] = useState<string>(marketplaceShares[0].id);
  const [owned, setOwned] = useState<Record<string, boolean>>({
    "missed-call": true,
    "hvac-agent": true,
    "sales-agent": true,
    "support-agent": true,
  });
  const [note, setNote] = useState<string | null>(null);
  const [publishName, setPublishName] = useState("");
  const [publishType, setPublishType] = useState("Industry agents");

  const typeFilter = TAB_TYPE[tab] ?? "All";
  const filtered = useMemo(
    () =>
      typeFilter === "All"
        ? marketplaceShares
        : marketplaceShares.filter((item) => item.type === typeFilter),
    [typeFilter],
  );
  const selected = marketplaceShares.find((item) => item.id === selectedId) ?? marketplaceShares[0];
  const installedItems = marketplaceShares.filter((item) => owned[item.id]);

  function setTab(next: TabId) {
    router.replace(`/app/marketplace?tab=${next}`, { scroll: false });
  }

  function toggleOwn(id: string, name: string) {
    setOwned((prev) => {
      const next = !prev[id];
      setNote(next ? `Installed “${name}” on this business.` : `Removed “${name}”.`);
      return { ...prev, [id]: next };
    });
  }

  function onPublish(e: FormEvent) {
    e.preventDefault();
    if (!publishName.trim()) return;
    setNote(`Submitted “${publishName.trim()}” (${publishType}) for marketplace review.`);
    setPublishName("");
  }

  const browse =
    tab === "discover" ||
    tab === "agents" ||
    tab === "workflows" ||
    tab === "industry-packs" ||
    tab === "automations" ||
    tab === "integrations" ||
    tab === "templates";

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
          <small>Agents · workflows · packs</small>
        </div>
        <div className="stat">
          <span>Installed</span>
          <strong>{Object.values(owned).filter(Boolean).length}</strong>
          <small>On this business</small>
        </div>
        <div className="stat">
          <span>Model</span>
          <strong>Discover · install</strong>
          <small>One marketplace</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Atlas Marketplace">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {browse ? (
        <>
          <div className="split">
            <section className="panel">
              <h2>{tab === "discover" ? "Discover" : TABS.find((item) => item.id === tab)?.label}</h2>
              <p className="panel-lead">
                Expand Atlas with AI agents, integrations, workflows, and industry packs — install what your business
                needs.
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
                <button className="btn btn-dark" type="button" onClick={() => toggleOwn(selected.id, selected.name)}>
                  {owned[selected.id] ? "Uninstall" : selected.price === "Free" ? "Install" : "Buy & install"}
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

      {tab === "installed" ? (
        <section className="panel">
          <h2>Installed on this business</h2>
          <p className="panel-lead">Agents, automations, and modules you chose — not a second store.</p>
          {installedItems.length === 0 ? (
            <p className="muted-line">Nothing installed yet. Open Discover to add packs.</p>
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
                  <button type="button" className="btn btn-outline" onClick={() => toggleOwn(item.id, item.name)}>
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

      {tab === "developer" ? (
        <>
          <section className="panel">
            <h2>Publish as a developer</h2>
            <p className="panel-lead">
              Ship industry agents, dashboards, automations, reports, integrations, or templates for businesses to install.
            </p>
            <form className="hub-pto-form" onSubmit={onPublish}>
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
          <AppStoreStudio />
        </>
      ) : null}
    </div>
  );
}

export function MarketplaceStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading marketplace…</p>}>
      <MarketplaceStudioInner />
    </Suspense>
  );
}
