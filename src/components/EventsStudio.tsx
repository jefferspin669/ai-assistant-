"use client";

import { FormEvent, useEffect, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { eventTypes } from "@/lib/data";
import {
  loadEvents,
  planEventFromInput,
  saveEvents,
  type PlannedEvent,
} from "@/lib/user-workspace";

export function EventsStudio() {
  const { tAction, t } = useLanguage();
  const [events, setEvents] = useState<PlannedEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(eventTypes[0]);
  const [guests, setGuests] = useState("40");
  const [budget, setBudget] = useState("1000");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadEvents();
    setEvents(loaded);
    setSelectedId(loaded[0]?.id ?? null);
    setShowForm(loaded.length === 0);
    setReady(true);
  }, []);

  const selected = events.find((event) => event.id === selectedId) ?? null;

  function persist(next: PlannedEvent[]) {
    setEvents(next);
    saveEvents(next);
  }

  function onPlan(e: FormEvent) {
    e.preventDefault();
    const planned = planEventFromInput({
      title,
      type,
      guests: Number(guests) || 20,
      budget: Number(budget) || 500,
      date,
      notes,
    });
    const next = [planned, ...events];
    persist(next);
    setSelectedId(planned.id);
    setShowForm(false);
    setTitle("");
    setNotes("");
  }

  function removeEvent(id: string) {
    const next = events.filter((event) => event.id !== id);
    persist(next);
    setSelectedId(next[0]?.id ?? null);
    if (next.length === 0) setShowForm(true);
  }

  return (
    <div className="training-studio">
      <section className="panel">
        <h2>Event types</h2>
        <p className="panel-lead">
          Celebrations, reunions, and company events — Atlas builds guest lists, vendors, budgets, and timelines.
        </p>
        <div className="pack-grid">
          {eventTypes.map((item) => (
            <button
              className="pack-chip"
              key={item}
              type="button"
              onClick={() => {
                setType(item);
                setShowForm(true);
              }}
            >
              <strong>{item}</strong>
            </button>
          ))}
        </div>
      </section>

      {showForm ? (
        <section className="panel">
          <h2>Plan a new event</h2>
          <p className="panel-lead">Describe the event — Atlas builds a checklist and budget split.</p>
          <form className="form-grid" onSubmit={onPlan}>
            <label>
              Title
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Maya’s 40th birthday"
                required
              />
            </label>
            <label>
              Type
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {eventTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Guests
              <input type="number" min={1} value={guests} onChange={(e) => setGuests(e.target.value)} />
            </label>
            <label>
              Budget ($)
              <input type="number" min={100} value={budget} onChange={(e) => setBudget(e.target.value)} />
            </label>
            <label>
              Date
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              Notes
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Outdoor, kids welcome…"
              />
            </label>
            <button className="btn btn-dark" type="submit">
              {tAction("Plan with Atlas")}
            </button>
          </form>
        </section>
      ) : (
        <div className="cta-row">
          <button className="btn btn-dark" type="button" onClick={() => setShowForm(true)}>
            {tAction("Plan with Atlas")}
          </button>
        </div>
      )}

      <div className="split">
        <section className="panel">
          <h2>Your events</h2>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && events.length === 0 ? (
            <p className="muted-line">{t("common.empty")}</p>
          ) : (
            <div className="list">
              {events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className={selectedId === event.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setSelectedId(event.id)}
                >
                  <span className="badge">{event.type}</span>
                  <div>
                    <p>
                      <strong>{event.title}</strong>
                    </p>
                    <small className="muted-line">
                      {event.guests} guests · ${event.budget}
                      {event.date ? ` · ${event.date}` : ""}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          {selected ? (
            <>
              <div className="train-head">
                <div>
                  <h2>{selected.title}</h2>
                  <p className="panel-lead">
                    {selected.guests} guests · ${selected.budget} budget
                    {selected.notes ? ` · ${selected.notes}` : ""}
                  </p>
                </div>
                <button className="btn btn-outline" type="button" onClick={() => removeEvent(selected.id)}>
                  {t("common.remove")}
                </button>
              </div>
              <div className="chat-mock" style={{ marginBottom: "1rem" }}>
                <div className="bubble bubble-user">
                  Plan a {selected.type.toLowerCase()} for {selected.guests} people with a ${selected.budget} budget.
                </div>
                <div className="bubble bubble-ai">
                  Got it — {selected.guests} guests, ${selected.budget} budget. Checklist, budget split, and day-of
                  reminders are ready.
                </div>
              </div>
              <div className="split">
                <div>
                  <h3>Checklist</h3>
                  <ul className="plain-list" style={{ marginTop: "0.5rem" }}>
                    {selected.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Budget</h3>
                  <div className="list" style={{ marginTop: "0.5rem" }}>
                    {selected.budgetRows.map((row) => (
                      <div className="list-row" key={row.item}>
                        <span>{row.item}</span>
                        <strong>{row.amount}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="muted-line">Plan an event to see checklist and budget here.</p>
          )}
        </section>
      </div>
    </div>
  );
}
