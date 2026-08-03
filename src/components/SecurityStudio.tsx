"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  securityAuditLog,
  securityCategories,
  securityEvents,
  securityStats,
} from "@/lib/atlas-platform";
import {
  createSecurityItem,
  loadSecurityItems,
  loadSensitiveLocked,
  saveSecurityItems,
  saveSensitiveLocked,
  type SecurityItem,
} from "@/lib/surface-workspace";

type Mode =
  | "overview"
  | "queue"
  | "logins"
  | "fraud"
  | "leaks"
  | "spending"
  | "accounts"
  | "devices"
  | "passwords"
  | "backups"
  | "audit"
  | "add";

const modes: { id: Mode; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "queue", label: "Approvals" },
  { id: "logins", label: "Logins" },
  { id: "devices", label: "Devices" },
  { id: "passwords", label: "Password health" },
  { id: "backups", label: "Backups" },
  { id: "fraud", label: "Fraud" },
  { id: "leaks", label: "Data leaks" },
  { id: "spending", label: "Spending" },
  { id: "accounts", label: "Account changes" },
  { id: "add", label: "Add item" },
  { id: "audit", label: "Audit log" },
];

function statusTone(status: string) {
  if (status === "Allowed" || status === "Healthy" || status === "Approved" || status === "Locked") {
    return "ok";
  }
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
    case "devices":
      return "Devices";
    case "passwords":
      return "Passwords";
    case "backups":
      return "Backups";
    default:
      return "All";
  }
}

function toSecurityItem(event: (typeof securityEvents)[number]): SecurityItem {
  return {
    id: event.id,
    category: event.category,
    event: event.event,
    detail: event.detail,
    status: event.status,
    when: event.when,
    risk: event.risk,
    note: event.note,
    sensitive: event.status === "Needs approval",
    createdAt: "",
  };
}

export function SecurityStudio({ lockSignal = 0 }: { lockSignal?: number }) {
  const [mode, setMode] = useState<Mode>("overview");
  const [category, setCategory] = useState<(typeof securityCategories)[number]>("All");
  const [customItems, setCustomItems] = useState<SecurityItem[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(securityEvents[0].id);
  const [note, setNote] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventCategory, setEventCategory] = useState<string>("Logins");
  const [eventDetail, setEventDetail] = useState("");
  const [eventRisk, setEventRisk] = useState("Medium");
  const [eventSensitive, setEventSensitive] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCustomItems(loadSecurityItems());
    setLocked(loadSensitiveLocked());
    setReady(true);
  }, []);

  useEffect(() => {
    if (lockSignal <= 0) return;
    toggleLock(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockSignal]);

  const catalog = useMemo(() => securityEvents.map(toSecurityItem), []);
  const allEvents = useMemo(() => [...customItems, ...catalog], [customItems, catalog]);

  const effectiveCategory =
    mode === "overview" || mode === "queue" || mode === "audit" || mode === "add"
      ? category
      : categoryForMode(mode);

  const filtered = useMemo(() => {
    let base = allEvents;
    if (mode === "queue") {
      base = allEvents.filter(
        (event) => (resolutions[event.id] ?? event.status) === "Needs approval",
      );
    }
    if (mode === "audit" || effectiveCategory === "All") return base;
    return base.filter((event) => event.category === effectiveCategory);
  }, [allEvents, effectiveCategory, mode, resolutions]);

  const selected = allEvents.find((event) => event.id === selectedId) ?? allEvents[0];
  const selectedStatus = resolutions[selected?.id ?? ""] ?? selected?.status ?? "Allowed";

  const pendingCount = allEvents.filter(
    (event) => (resolutions[event.id] ?? event.status) === "Needs approval",
  ).length;

  function persistCustom(next: SecurityItem[]) {
    setCustomItems(next);
    saveSecurityItems(next);
  }

  function toggleLock(force?: boolean) {
    const next = force === undefined ? !locked : force;
    setLocked(next);
    saveSensitiveLocked(next);
    if (next) {
      const pending = allEvents.filter(
        (event) => (resolutions[event.id] ?? event.status) === "Needs approval" || event.sensitive,
      );
      const updates: Record<string, string> = {};
      for (const event of pending) {
        updates[event.id] = "Needs approval";
      }
      setResolutions((prev) => ({ ...prev, ...updates }));
      setMode("queue");
      setNote(
        `Sensitive actions locked. ${pending.length || "All"} sensitive item(s) now require owner approval before Atlas releases them.`,
      );
    } else {
      setNote("Sensitive-action lock released. Approvals still apply where required.");
    }
  }

  function resolve(id: string, status: "Approved" | "Denied" | "Blocked", label: string) {
    if (locked && status === "Approved") {
      setNote(`Cannot approve “${label}” while sensitive actions are locked. Unlock first.`);
      return;
    }
    setResolutions((prev) => ({ ...prev, [id]: status }));
    setNote(`${label} marked ${status.toLowerCase()}. Atlas logged the decision.`);
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const item = createSecurityItem({
      category: eventCategory,
      event: eventName,
      detail: eventDetail,
      risk: eventRisk,
      sensitive: eventSensitive || locked,
      note: locked
        ? "Created while sensitive actions are locked — requires approval."
        : "Owner-added security watch item.",
    });
    const next = [item, ...customItems];
    persistCustom(next);
    setSelectedId(item.id);
    setEventName("");
    setEventDetail("");
    setNote(`Added “${item.event}”.`);
    setMode("overview");
  }

  function removeCustom(id: string) {
    persistCustom(customItems.filter((item) => item.id !== id));
    setNote("Custom security item removed.");
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
        <div className="stat">
          <span>Sensitive lock</span>
          <strong>{locked ? "On" : "Off"}</strong>
          <small>{locked ? "Approvals required" : "Normal flow"}</small>
        </div>
      </div>

      <div className="train-actions" style={{ marginTop: 0 }}>
        <button
          className={`btn ${locked ? "btn-outline" : "btn-dark"}`}
          type="button"
          onClick={() => toggleLock()}
        >
          {locked ? "Unlock sensitive actions" : "Lock sensitive actions"}
        </button>
        <button className="btn btn-outline" type="button" onClick={() => setMode("add")}>
          Add security item
        </button>
      </div>
      {note ? <p className="muted-line">{note}</p> : null}

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
              if (item.id === "overview" || item.id === "queue") setCategory("All");
            }}
          >
            {item.label}
            {item.id === "queue" && pendingCount > 0 ? (
              <span className="hub-tab-count">{pendingCount}</span>
            ) : null}
          </button>
        ))}
      </div>

      {mode === "add" ? (
        <section className="panel">
          <h2>Add security item</h2>
          <p className="panel-lead">Create watches, sensitive actions, or approval gates.</p>
          <form className="form-grid" onSubmit={onAdd}>
            <label>
              Event
              <input
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Export payroll CSV"
                required
              />
            </label>
            <label>
              Category
              <select value={eventCategory} onChange={(e) => setEventCategory(e.target.value)}>
                {securityCategories
                  .filter((cat) => cat !== "All")
                  .map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
              </select>
            </label>
            <label>
              Detail
              <input
                value={eventDetail}
                onChange={(e) => setEventDetail(e.target.value)}
                placeholder="Who / where / amount"
              />
            </label>
            <label>
              Risk
              <select value={eventRisk} onChange={(e) => setEventRisk(e.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="quality-check-row">
              <input
                type="checkbox"
                checked={eventSensitive || locked}
                onChange={(e) => setEventSensitive(e.target.checked)}
              />
              <span>Sensitive — needs owner approval</span>
            </label>
            <button className="btn btn-dark" type="submit">
              Add item
            </button>
          </form>
        </section>
      ) : null}

      {mode === "overview" ? (
        <div className="split">
          <section className="panel">
            <h2>Detection coverage</h2>
            <p className="panel-lead">
              Threat detection, login monitoring, devices, password health, 2FA checks, audit logs,
              and backup monitoring{!ready ? "" : ` · ${customItems.length} custom item(s)`}.
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
                    <span
                      className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}
                    >
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
            {selected ? (
              <>
                <h2>{selected.event}</h2>
                <div className="list">
                  <div className="list-row">
                    <span className="badge">{selected.category}</span>
                    <p>{selected.detail}</p>
                  </div>
                  <div className="list-row">
                    <span
                      className={`badge${selected.risk === "High" ? " warn" : selected.risk === "Low" ? " ok" : ""}`}
                    >
                      {selected.risk}
                    </span>
                    <p>Risk · {selected.when}</p>
                  </div>
                  <div className="list-row">
                    <span
                      className={`badge${statusTone(selectedStatus) === "ok" ? " ok" : statusTone(selectedStatus) === "warn" ? " warn" : ""}`}
                    >
                      {selectedStatus}
                    </span>
                    <p>Current status{locked && selected.sensitive ? " · lock on" : ""}</p>
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
                {customItems.some((item) => item.id === selected.id) ? (
                  <button
                    className="btn btn-outline"
                    type="button"
                    style={{ marginTop: "0.75rem" }}
                    onClick={() => removeCustom(selected.id)}
                  >
                    Remove custom item
                  </button>
                ) : null}
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "audit" ? (
        <section className="panel">
          <h2>Audit log</h2>
          <p className="panel-lead">Immutable trail of security actions across the business.</p>
          <div className="list">
            {(locked
              ? [
                  {
                    when: "Just now",
                    actor: "Owner",
                    action: "Locked sensitive actions — approvals required",
                  },
                  ...securityAuditLog,
                ]
              : securityAuditLog
            ).map((entry) => (
              <div className="list-row" key={entry.when + entry.action}>
                <span className="time">{entry.when}</span>
                <p>
                  <strong>{entry.actor}</strong>
                  <span className="muted-line">{entry.action}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode !== "overview" && mode !== "audit" && mode !== "add" ? (
        <section className="panel">
          <h2>
            {mode === "queue"
              ? "Pending approvals"
              : mode === "logins"
                ? "Login monitoring"
                : mode === "devices"
                  ? "Device management"
                  : mode === "passwords"
                    ? "Password health & 2FA"
                    : mode === "backups"
                      ? "Backup monitoring"
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
              ? locked
                ? "Sensitive actions are locked — approve only after unlocking, or deny to keep blocked."
                : "Owner decisions required before Atlas releases the action."
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
                    <span
                      className={`badge${statusTone(status) === "ok" ? " ok" : statusTone(status) === "warn" ? " warn" : ""}`}
                    >
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
        </section>
      ) : null}
    </div>
  );
}
