"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createTimelineItem,
  loadTimelineItems,
  saveTimelineItems,
  type TimelineItem,
} from "@/lib/surface-workspace";
import { customerRelationshipSummary, TIMELINE_CHANNELS } from "@/lib/crm-workspace";
import type { CrmCustomer } from "@/lib/surface-workspace";

export function CrmTimelinePanel({ customer }: { customer: CrmCustomer | null }) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [channel, setChannel] = useState("Note");
  const [text, setText] = useState("");

  const name = customer?.name || customer?.businessName || "";

  useEffect(() => {
    setItems(loadTimelineItems());
  }, []);

  const filtered = useMemo(
    () => items.filter((i) => i.customer.toLowerCase() === name.toLowerCase()),
    [items, name],
  );

  function persist(next: TimelineItem[]) {
    setItems(next);
    saveTimelineItems(next);
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    const item = createTimelineItem({ channel, text, customer: name });
    persist([item, ...items]);
    setText("");
  }

  if (!customer) return <p className="muted-line">Select a customer.</p>;

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">Atlas relationship summary</div>
        <p>{customerRelationshipSummary(customer)}</p>
      </div>

      <form className="form-grid" onSubmit={onAdd}>
        <label>
          Channel
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            {TIMELINE_CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Entry
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="What happened?" required />
        </label>
        <button className="btn btn-dark" type="submit">Add to timeline</button>
      </form>

      <div className="timeline" style={{ marginTop: "1rem" }}>
        {filtered.length === 0 ? (
          <p className="muted-line">No timeline events yet.</p>
        ) : (
          filtered.map((event) => (
            <div className="timeline-item" key={event.id}>
              <div className="time">{event.when}</div>
              <span className="badge">{event.channel}</span>
              <p>{event.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
