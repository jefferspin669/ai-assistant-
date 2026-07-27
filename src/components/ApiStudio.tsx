"use client";

import { useMemo, useState } from "react";
import { apiConnectors, apiSurfaces } from "@/lib/atlas-platform";

type Mode = "connectors" | "keys" | "webhooks";

const modes: { id: Mode; label: string }[] = [
  { id: "connectors", label: "Connectors" },
  { id: "keys", label: "API keys" },
  { id: "webhooks", label: "Webhooks" },
];

export function ApiStudio() {
  const [mode, setMode] = useState<Mode>("connectors");
  const [selectedId, setSelectedId] = useState<string>(apiConnectors[0].id);
  const [connected, setConnected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(apiConnectors.map((c) => [c.id, c.status === "Connected"])),
  );
  const [note, setNote] = useState<string | null>(null);
  const [keyRevealed, setKeyRevealed] = useState(false);

  const selected = useMemo(
    () => apiConnectors.find((item) => item.id === selectedId) ?? apiConnectors[0],
    [selectedId],
  );

  const connectedCount = Object.values(connected).filter(Boolean).length;

  function toggleConnect(id: string, name: string) {
    setConnected((prev) => {
      const next = !prev[id];
      setNote(next ? `Connected ${name}.` : `Disconnected ${name}.`);
      return { ...prev, [id]: next };
    });
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Connectors</span>
          <strong>{apiConnectors.length}</strong>
          <small>Accounting to custom</small>
        </div>
        <div className="stat">
          <span>Connected</span>
          <strong>{connectedCount}</strong>
          <small>Live integrations</small>
        </div>
        <div className="stat">
          <span>API surface</span>
          <strong>REST</strong>
          <small>+ webhooks</small>
        </div>
        <div className="stat">
          <span>Auth</span>
          <strong>Scoped</strong>
          <small>Least privilege keys</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Atlas API modes">
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

      {mode === "connectors" ? (
        <div className="split">
          <section className="panel">
            <h2>Developer connectors</h2>
            <p className="panel-lead">
              Connect accounting software, payment processors, calendar apps, email providers, SMS
              providers, shipping carriers, e-commerce platforms, and custom software.
            </p>
            <div className="list">
              {apiConnectors.map((connector) => (
                <button
                  key={connector.id}
                  type="button"
                  className={selectedId === connector.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setSelectedId(connector.id)}
                >
                  <span className={`badge${connected[connector.id] ? " ok" : ""}`}>
                    {connected[connector.id] ? "Connected" : "Available"}
                  </span>
                  <div>
                    <p>
                      <strong>{connector.name}</strong>
                    </p>
                    <small className="muted-line">{connector.examples}</small>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>{selected.name}</h2>
            <div className="list">
              <div className="list-row">
                <span className="badge">Examples</span>
                <p>{selected.examples}</p>
              </div>
              <div className="list-row">
                <span className="badge ok">Scope</span>
                <p>{selected.scope}</p>
              </div>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => toggleConnect(selected.id, selected.name)}
              >
                {connected[selected.id] ? "Disconnect" : "Connect"}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setMode("keys")}>
                View API keys
              </button>
            </div>
            {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
          </section>
        </div>
      ) : null}

      {mode === "keys" ? (
        <section className="panel">
          <h2>API keys</h2>
          <p className="panel-lead">Scoped keys for custom software — rotate anytime from Security Center.</p>
          <div className="memory-card">
            <div className="label">Production key</div>
            <p style={{ fontFamily: "ui-monospace, monospace" }}>
              {keyRevealed ? "atlas_live_8f3c…9a21" : "atlas_live_••••••••••••"}
            </p>
          </div>
          <div className="train-actions">
            <button className="btn btn-dark" type="button" onClick={() => setKeyRevealed((v) => !v)}>
              {keyRevealed ? "Hide key" : "Reveal key"}
            </button>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() => setNote("Key rotation scheduled. Old key expires in 24 hours.")}
            >
              Rotate key
            </button>
          </div>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      ) : null}

      {mode === "webhooks" ? (
        <section className="panel">
          <h2>Webhooks & surfaces</h2>
          <div className="list">
            {apiSurfaces.map((surface) => (
              <div className="list-row" key={surface.text}>
                <span className={`badge${surface.tone === "ok" ? " ok" : ""}`}>{surface.badge}</span>
                <p>{surface.text}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
