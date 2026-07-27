"use client";

import { useMemo, useState } from "react";
import {
  securityCategories,
  securityEvents,
  securityStats,
} from "@/lib/atlas-platform";

type Mode = "overview" | "queue" | "logins" | "fraud" | "leaks" | "spending" | "accounts";

const modes: { id: Mode; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "queue", label: "Approvals" },
  { id: "logins", label: "Logins" },
  { id: "fraud", label: "Fraud" },
  { id: "leaks", label: "Data leaks" },
  { id: "spending", label: "Spending" },
  { id: "accounts", label: "Account changes" },
];

function statusTone(status: string) {
  if (status === "Allowed" || status === "Healthy" || status === "Approved") return "ok";
  if (status === "Blocked" || status === "Revoked" || status === "Denied") return "warn";
  if (status === "Needs approval") return "warn";
  return "";
}

function categoryForMode(mode: Mode) {
  switch (mode) {
    case "logins":
      return "Logins";
    case "fraud":
      return "Fraud";
    case "leaks":
      return "Data leaks";
    case "spending":
      return "Spending";
    case "accounts":
      return "Account changes";
    default:
      return "All";
  }
}

export function SecurityStudio() {
  const [mode, setMode] = useState<Mode>("overview");
  const [category, setCategory] = useState<(typeof securityCategories)[number]>("All");
  const [selectedId, setSelectedId] = useState<string>(securityEvents[0].id);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string | null>(null);

  const effectiveCategory =
    mode === "overview" || mode === "queue" ? category : categoryForMode(mode);

  const filtered = useMemo(() => {
    const base =
      mode === "queue"
        ? securityEvents.filter(
            (event) => (resolutions[event.id] ?? event.status) === "Needs approval",
          )
        : securityEvents;
    if (effectiveCategory === "All") return base;
    return base.filter((event) => event.category === effectiveCategory);
  }, [effectiveCategory, mode, resolutions]);

  const selected = securityEvents.find((event) => event.id === selectedId) ?? securityEvents[0];
  const selectedStatus = resolutions[selected.id] ?? selected.status;

  const pendingCount = securityEvents.filter(
    (event) => (resolutions[event.id] ?? event.status) === "Needs approval",
  ).length;

  function resolve(id: string, status: "Approved" | "Denied" | "Blocked", label: string) {
    setResolutions((prev) => ({ ...prev, [id]: status }));
    setNote(`${label} marked ${status.toLowerCase()}. Atlas logged the decision.`);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        {securityStats.map((stat) => (
          <div className="stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>
              {stat.label === "Pending approvals" ? String(pendingCount) : stat.value}
            </strong>
            <small>{stat.detail}</small>
          </div>
        ))}
      </div>

      <div className="training-tabs" role="tablist" aria-label="Security center modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => {
              setMode(item.id);
              if (item.id === "overview") setCategory("All");
            }}
          >
            {item.label}
            {item.id === "queue" && pendingCount > 0 ? (
              <span className="hub-tab-count">{pendingCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      {mode === "overview" ? (
        <div className="split">
          <section className="panel">
            <h2>Detection coverage</h2>
            <p className="panel-lead">
              Atlas watches suspicious logins, fraud, data leaks, unusual spending, and account
              changes.
            </p>
            <div className="quality-filter-row">
              {securityCategories.map((cat) => (
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
            <div className="list" style={{ marginTop: "0.9rem" }}>
              {filtered.map((event) => {
                const status = resolutions[event.id] ?? event.status;
                return (
                  <button
                    key={event.id}
                    type="button"
                    className={selectedId === event.id ? "compliance-row active" : "compliance-row"}
                    onClick={() => setSelectedId(event.id)}
                  >
                    <span className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}>
                      {status}
                    </span>
                    <div>
                      <p>
                        <strong>{event.event}</strong>
                      </p>
                      <small className="muted-line">
                        {event.category} · {event.when} · {event.detail}
                      </small>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <h2>{selected.event}</h2>
            <div className="list">
              <div className="list-row">
                <span className="badge">{selected.category}</span>
                <p>{selected.detail}</p>
              </div>
              <div className="list-row">
                <span className={`badge${selected.risk === "High" ? " warn" : selected.risk === "Low" ? " ok" : ""}`}>
                  {selected.risk}
                </span>
                <p>Risk · {selected.when}</p>
              </div>
              <div className="list-row">
                <span className={`badge${statusTone(selectedStatus) === "ok" ? " ok" : statusTone(selectedStatus) === "warn" ? " warn" : ""}`}>
                  {selectedStatus}
                </span>
                <p>Current status</p>
              </div>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Atlas note</div>
              <p>{selected.note}</p>
            </div>
            {selectedStatus === "Needs approval" ? (
              <div className="train-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => resolve(selected.id, "Approved", selected.event)}
                >
                  Approve
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => resolve(selected.id, "Denied", selected.event)}
                >
                  Deny
                </button>
              </div>
            ) : null}
            {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
          </section>
        </div>
      ) : null}

      {mode !== "overview" ? (
        <section className="panel">
          <h2>
            {mode === "queue"
              ? "Pending approvals"
              : mode === "logins"
                ? "Suspicious logins"
                : mode === "fraud"
                  ? "Fraud detection"
                  : mode === "leaks"
                    ? "Data leak watch"
                    : mode === "spending"
                      ? "Unusual spending"
                      : "Account changes"}
          </h2>
          <p className="panel-lead">
            {mode === "queue"
              ? "Owner decisions required before Atlas releases the action."
              : "Live detections in this category — approve, deny, or review Atlas notes."}
          </p>
          <div className="list">
            {filtered.length === 0 ? (
              <div className="list-row">
                <span className="badge ok">Clear</span>
                <p>No open items in this view.</p>
              </div>
            ) : (
              filtered.map((event) => {
                const status = resolutions[event.id] ?? event.status;
                return (
                  <div className="list-row" key={event.id}>
                    <span className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}>
                      {status}
                    </span>
                    <div>
                      <p>
                        <strong>{event.event}</strong>
                      </p>
                      <small className="muted-line">
                        {event.when} · {event.detail} · Risk {event.risk}
                      </small>
                      <p style={{ marginTop: "0.35rem" }}>{event.note}</p>
                      {status === "Needs approval" ? (
                        <div className="train-actions">
                          <button
                            className="btn btn-dark"
                            type="button"
                            onClick={() => resolve(event.id, "Approved", event.event)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-outline"
                            type="button"
                            onClick={() => resolve(event.id, "Denied", event.event)}
                          >
                            Deny
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
