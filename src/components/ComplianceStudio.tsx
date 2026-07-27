"use client";

import { useMemo, useState } from "react";
import {
  complianceCategories,
  complianceItems,
  complianceReminders,
} from "@/lib/atlas-platform";

type Mode = "board" | "reminders" | "renewals" | "osha";

const modes: { id: Mode; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "reminders", label: "Reminders" },
  { id: "renewals", label: "Renewals" },
  { id: "osha", label: "OSHA & regs" },
];

function statusTone(status: string) {
  if (status === "OK" || status === "Scheduled") return "ok";
  if (status === "Renew soon" || status === "Due soon" || status === "Due Friday") return "warn";
  return "";
}

export function ComplianceStudio() {
  const [mode, setMode] = useState<Mode>("board");
  const [category, setCategory] = useState<(typeof complianceCategories)[number]>("All");
  const [selectedId, setSelectedId] = useState<string>(complianceItems[0].id);
  const [doneIds, setDoneIds] = useState<Record<string, boolean>>({});
  const [snoozed, setSnoozed] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      category === "All"
        ? complianceItems
        : complianceItems.filter((item) => item.category === category),
    [category],
  );

  const selected = complianceItems.find((item) => item.id === selectedId) ?? complianceItems[0];

  const needingAttention = complianceItems.filter((item) =>
    ["Renew soon", "Due soon", "Due Friday"].includes(item.status),
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of complianceItems) {
      map[item.category] = (map[item.category] ?? 0) + 1;
    }
    return map;
  }, []);

  function markComplete(id: string, label: string) {
    setDoneIds((prev) => ({ ...prev, [id]: true }));
    setNote(`Marked complete: ${label}. Atlas logged it to the compliance timeline.`);
  }

  function snoozeReminder(id: string, text: string) {
    setSnoozed((prev) => ({ ...prev, [id]: true }));
    setNote(`Snoozed “${text}” for 3 days. Atlas will nudge again.`);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Tracked items</span>
          <strong>{complianceItems.length}</strong>
          <small>Across 6 categories</small>
        </div>
        <div className="stat">
          <span>Needs attention</span>
          <strong>{needingAttention.length}</strong>
          <small>Renewals & due soon</small>
        </div>
        <div className="stat">
          <span>Licenses</span>
          <strong>{counts.Licenses ?? 0}</strong>
          <small>Business + contractor</small>
        </div>
        <div className="stat">
          <span>Certifications</span>
          <strong>{counts.Certifications ?? 0}</strong>
          <small>EPA & required cards</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Compliance modes">
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
            {item.id === "renewals" && needingAttention.length > 0 ? (
              <span className="hub-tab-count">{needingAttention.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {mode === "board" ? (
        <div className="split">
          <section className="panel">
            <h2>Compliance board</h2>
            <p className="panel-lead">
              License renewals, safety inspections, insurance expirations, required certifications,
              OSHA reminders, and industry regulations.
            </p>
            <div className="quality-filter-row">
              {complianceCategories.map((cat) => (
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
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    selectedId === item.id ? "compliance-row active" : "compliance-row"
                  }
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={`badge${statusTone(item.status) === "ok" ? " ok" : statusTone(item.status) === "warn" ? " warn" : ""}`}>
                    {doneIds[item.id] ? "Done" : item.status}
                  </span>
                  <div>
                    <p>
                      <strong>{item.item}</strong>
                    </p>
                    <small className="muted-line">
                      {item.category} · Due {item.due} · {item.owner}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>{selected.item}</h2>
            <div className="list">
              <div className="list-row">
                <span className="badge">{selected.category}</span>
                <p>Category</p>
              </div>
              <div className="list-row">
                <span className={`badge${statusTone(selected.status) === "ok" ? " ok" : statusTone(selected.status) === "warn" ? " warn" : ""}`}>
                  {doneIds[selected.id] ? "Done" : selected.status}
                </span>
                <p>Due {selected.due}</p>
              </div>
              <div className="list-row">
                <span className="badge">Owner</span>
                <p>{selected.owner}</p>
              </div>
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Atlas note</div>
              <p>{selected.note}</p>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => markComplete(selected.id, selected.item)}
                disabled={Boolean(doneIds[selected.id])}
              >
                {doneIds[selected.id] ? "Completed" : "Mark complete"}
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setMode("reminders");
                  setNote(`Reminder focused on ${selected.item}.`);
                }}
              >
                View reminders
              </button>
            </div>
            {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
          </section>
        </div>
      ) : null}

      {mode === "reminders" ? (
        <section className="panel">
          <h2>Reminders</h2>
          <p className="panel-lead">Atlas nudges before expirations and weekly OSHA obligations.</p>
          <div className="list">
            {complianceReminders.map((reminder) => (
              <div className="list-row" key={reminder.id}>
                <span
                  className={`badge${
                    reminder.tone === "ok" ? " ok" : reminder.tone === "warn" ? " warn" : ""
                  }`}
                >
                  {snoozed[reminder.id] ? "Snoozed" : reminder.badge}
                </span>
                <div>
                  <p>
                    <strong>{reminder.text}</strong>
                  </p>
                  <small className="muted-line">{reminder.detail}</small>
                  {!snoozed[reminder.id] && reminder.tone === "warn" ? (
                    <div className="train-actions">
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => snoozeReminder(reminder.id, reminder.text)}
                      >
                        Snooze 3 days
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      ) : null}

      {mode === "renewals" ? (
        <section className="panel">
          <h2>Upcoming renewals & due items</h2>
          <div className="list">
            {needingAttention.map((item) => (
              <div className="list-row" key={item.id}>
                <span className="badge warn">{item.status}</span>
                <div>
                  <p>
                    <strong>{item.item}</strong>
                  </p>
                  <small className="muted-line">
                    {item.category} · Due {item.due} · {item.owner}
                  </small>
                  <p style={{ marginTop: "0.35rem" }}>{item.note}</p>
                  <div className="train-actions">
                    <button
                      className="btn btn-dark"
                      type="button"
                      onClick={() => {
                        setSelectedId(item.id);
                        setCategory(item.category);
                        setMode("board");
                      }}
                    >
                      Open item
                    </button>
                    <button
                      className="btn btn-outline"
                      type="button"
                      disabled={Boolean(doneIds[item.id])}
                      onClick={() => markComplete(item.id, item.item)}
                    >
                      {doneIds[item.id] ? "Completed" : "Mark complete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "osha" ? (
        <div className="split">
          <section className="panel">
            <h2>OSHA</h2>
            <div className="list">
              {complianceItems
                .filter((item) => item.category === "OSHA")
                .map((item) => (
                  <div className="list-row" key={item.id}>
                    <span className={`badge${statusTone(item.status) === "ok" ? " ok" : " warn"}`}>
                      {doneIds[item.id] ? "Done" : item.status}
                    </span>
                    <div>
                      <p>
                        <strong>{item.item}</strong>
                      </p>
                      <small className="muted-line">Due {item.due}</small>
                      <p style={{ marginTop: "0.35rem" }}>{item.note}</p>
                    </div>
                  </div>
                ))}
            </div>
          </section>
          <section className="panel">
            <h2>Industry regulations</h2>
            <div className="list">
              {complianceItems
                .filter((item) => item.category === "Regulations")
                .map((item) => (
                  <div className="list-row" key={item.id}>
                    <span className="badge">{item.status}</span>
                    <div>
                      <p>
                        <strong>{item.item}</strong>
                      </p>
                      <small className="muted-line">Due {item.due} · {item.owner}</small>
                      <p style={{ marginTop: "0.35rem" }}>{item.note}</p>
                    </div>
                  </div>
                ))}
            </div>
            <div className="memory-card" style={{ marginTop: "1rem" }}>
              <div className="label">Atlas watches</div>
              <p>
                Refrigerant handling, disposal manifests, and HVAC industry pack updates — so
                nothing expires quietly.
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
