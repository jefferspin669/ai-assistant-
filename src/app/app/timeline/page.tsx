"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  createTimelineItem,
  loadTimelineItems,
  saveTimelineItems,
  type TimelineItem,
} from "@/lib/surface-workspace";

const CHANNELS = ["Phone", "Text", "Email", "Quote", "Job", "Payment", "Review", "Photo", "Note"];

export function TimelineStudio() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [customer, setCustomer] = useState("Elena Brooks");
  const [channel, setChannel] = useState("Note");
  const [when, setWhen] = useState("Just now");
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editChannel, setEditChannel] = useState("Note");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(loadTimelineItems());
    setReady(true);
  }, []);

  const customers = useMemo(() => {
    const names = new Set(items.map((item) => item.customer));
    names.add(customer || "Elena Brooks");
    return [...names];
  }, [items, customer]);

  const filtered = items.filter((item) => item.customer === customer);

  function persist(next: TimelineItem[]) {
    setItems(next);
    saveTimelineItems(next);
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const item = createTimelineItem({ when, channel, text, customer });
    persist([item, ...items]);
    setText("");
  }

  function startEdit(item: TimelineItem) {
    setEditingId(item.id);
    setEditText(item.text);
    setEditChannel(item.channel);
  }

  function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    persist(
      items.map((item) =>
        item.id === editingId
          ? { ...item, text: editText.trim() || item.text, channel: editChannel }
          : item,
      ),
    );
    setEditingId(null);
  }

  function removeItem(id: string) {
    persist(items.filter((item) => item.id !== id));
  }

  return (
    <div className="training-studio">
      <div className="split">
        <section className="panel">
          <h2>Customize timeline</h2>
          <p className="panel-lead">Add calls, texts, jobs, payments, photos, and notes — your timeline grows as you add.</p>
          <form className="form-grid" onSubmit={onAdd}>
            <label>
              Customer
              <input
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                list="timeline-customers"
                required
              />
              <datalist id="timeline-customers">
                {customers.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>
            <label>
              Channel
              <select value={channel} onChange={(e) => setChannel(e.target.value)}>
                {CHANNELS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              When
              <input value={when} onChange={(e) => setWhen(e.target.value)} />
            </label>
            <label>
              Entry
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What happened?"
                required
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Add to timeline
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>{customer}</h2>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && filtered.length === 0 ? (
            <p className="muted-line">Nothing on this timeline yet. Add your first entry.</p>
          ) : (
            <div className="timeline">
              {filtered.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <div className="time">{event.when}</div>
                  <span className="badge">{event.channel}</span>
                  {editingId === event.id ? (
                    <form className="form-grid" onSubmit={saveEdit} style={{ flex: 1 }}>
                      <select value={editChannel} onChange={(e) => setEditChannel(e.target.value)}>
                        {CHANNELS.map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                      <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <button className="btn btn-dark" type="submit">
                        Save
                      </button>
                      <button
                        className="btn btn-outline"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <p>{event.text}</p>
                      <div className="list-actions">
                        <button type="button" className="ghost-link" onClick={() => startEdit(event)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() => removeItem(event.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>Everything in one place</h2>
        <div className="list">
          {[
            { badge: "Calls", text: "Answered, missed, transferred" },
            { badge: "Messages", text: "SMS and email threads" },
            { badge: "Money", text: "Quotes, invoices, payments" },
            { badge: "Jobs", text: "Appointments, photos, notes, reviews" },
          ].map((row) => (
            <div className="list-row" key={row.badge}>
              <span className="badge">{row.badge}</span>
              <p>{row.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <AppShell
      title="Customer Timeline"
      subtitle="Customize and add calls, texts, emails, invoices, appointments, payments, reviews, photos, and notes — one timeline."
    >
      <TimelineStudio />
    </AppShell>
  );
}
