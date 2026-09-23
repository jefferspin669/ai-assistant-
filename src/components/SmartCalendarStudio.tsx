"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  CALENDAR_LAYERS,
  HOURS,
  addDays,
  buildSmartReminders,
  buildSuggestions,
  categoryById,
  createCategory,
  createEvent,
  deleteEvent,
  detectConflicts,
  eventsOnDay,
  filterEventsByLayers,
  findFreeGaps,
  formatDayLabel,
  formatTime,
  hydrateCalendarState,
  moveEventTo,
  pinnedDeadlines,
  saveCalendarState,
  startOfMonth,
  startOfWeek,
  type CalendarCategory,
  type CalendarEvent,
  type CalendarGoal,
  type CalendarLayerId,
  type CalendarView,
  type LifeEntry,
  type PostponedCalendarTask,
  type ScheduleSuggestion,
  type SharedCalendarMember,
  type SharedCalendarRequest,
} from "@/lib/smart-calendar";

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: "daily", label: "Day" },
  { id: "weekly", label: "Week" },
  { id: "monthly", label: "Month" },
  { id: "agenda", label: "Agenda" },
];

function monthMatrix(anchor: Date) {
  const start = startOfMonth(anchor);
  const gridStart = startOfWeek(start);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function SmartCalendarStudio({ embedded = false }: { embedded?: boolean } = {}) {
  const [ready, setReady] = useState(false);
  const [categories, setCategories] = useState<CalendarCategory[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<CalendarGoal[]>([]);
  const [activeLayers, setActiveLayers] = useState<CalendarLayerId[]>([]);
  const [sharedMembers, setSharedMembers] = useState<SharedCalendarMember[]>([]);
  const [sharedRequests, setSharedRequests] = useState<SharedCalendarRequest[]>([]);
  const [lifeTimeline, setLifeTimeline] = useState<LifeEntry[]>([]);
  const [postponedTasks, setPostponedTasks] = useState<PostponedCalendarTask[]>([]);
  const [view, setView] = useState<CalendarView>("weekly");
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [flash, setFlash] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("work");
  const [newHour, setNewHour] = useState(13);
  const [newOutdoor, setNewOutdoor] = useState(false);
  const [newPinned, setNewPinned] = useState(false);
  const [catLabel, setCatLabel] = useState("");
  const [catColor, setCatColor] = useState("#2f8f8a");

  useEffect(() => {
    let cancelled = false;
    void hydrateCalendarState().then((state) => {
      if (cancelled) return;
      setCategories(state.categories);
      setEvents(state.events);
      setGoals(state.goals);
      setActiveLayers(state.activeLayers);
      setSharedMembers(state.sharedMembers);
      setSharedRequests(state.sharedRequests);
      setLifeTimeline(state.lifeTimeline);
      setPostponedTasks(state.postponedTasks);
      setNewCategory(state.categories[0]?.id || "work");
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveCalendarState({
      categories,
      events,
      goals,
      activeLayers,
      sharedMembers,
      sharedRequests,
      lifeTimeline,
      postponedTasks,
    });
  }, [
    ready,
    categories,
    events,
    goals,
    activeLayers,
    sharedMembers,
    sharedRequests,
    lifeTimeline,
    postponedTasks,
  ]);

  const visibleEvents = useMemo(
    () => filterEventsByLayers(events, activeLayers),
    [events, activeLayers],
  );
  const conflicts = useMemo(() => detectConflicts(visibleEvents), [visibleEvents]);
  const suggestions = useMemo(() => buildSuggestions(visibleEvents, anchor), [visibleEvents, anchor]);
  const reminders = useMemo(() => buildSmartReminders(visibleEvents), [visibleEvents]);
  const freeGaps = useMemo(() => findFreeGaps(visibleEvents, anchor), [visibleEvents, anchor]);
  const deadlines = useMemo(() => pinnedDeadlines(visibleEvents), [visibleEvents]);
  const eventsToday = useMemo(() => eventsOnDay(visibleEvents, new Date()), [visibleEvents]);
  const upcomingCount = useMemo(() => {
    const now = Date.now();
    const week = now + 7 * 24 * 60 * 60 * 1000;
    return visibleEvents.filter((event) => {
      const start = new Date(event.start).getTime();
      return start >= now && start <= week;
    }).length;
  }, [visibleEvents]);

  function toggleLayer(layerId: CalendarLayerId) {
    setActiveLayers((prev) => {
      if (prev.includes(layerId)) {
        if (prev.length === 1) return prev;
        return prev.filter((id) => id !== layerId);
      }
      return [...prev, layerId];
    });
  }

  function note(msg: string) {
    setFlash(msg);
  }

  function applySuggestion(suggestion: ScheduleSuggestion) {
    const existing = events.find((e) => e.title === suggestion.title);
    if (existing && suggestion.actionLabel.startsWith("Move")) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === existing.id
            ? { ...e, start: suggestion.start, end: suggestion.end }
            : e,
        ),
      );
      note(`Moved “${suggestion.title}”. Reminders and invitees updated.`);
      return;
    }
    setEvents((prev) => [
      createEvent({
        title: suggestion.title,
        categoryId: suggestion.categoryId,
        start: suggestion.start,
        end: suggestion.end,
        invitees: [],
        notes: "Scheduled by Atlas AI",
        priority: suggestion.categoryId === "high-priority" ? "high" : "normal",
      }),
      ...prev,
    ]);
    note(`Reserved “${suggestion.title}”.`);
  }

  function onDropDay(day: Date, hour?: number) {
    if (!dragId) return;
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== dragId) return event;
        const next = new Date(day);
        if (typeof hour === "number") {
          next.setHours(hour, 0, 0, 0);
        } else {
          const original = new Date(event.start);
          next.setHours(original.getHours(), original.getMinutes(), 0, 0);
        }
        return moveEventTo(event, next);
      }),
    );
    const moved = events.find((e) => e.id === dragId);
    setDragId(null);
    note(
      moved
        ? `Moved “${moved.title}”. Reminders updated${
            moved.invitees.length ? ` and ${moved.invitees.length} invitee(s) notified` : ""
          }.`
        : "Event moved.",
    );
  }

  function addCustomCategory(e: FormEvent) {
    e.preventDefault();
    if (!catLabel.trim()) return;
    const category = createCategory(catLabel, catColor);
    setCategories((prev) => [...prev, category]);
    setNewCategory(category.id);
    setCatLabel("");
    note(`Category “${category.label}” created.`);
  }

  function addManualEvent(e: FormEvent) {
    e.preventDefault();
    const start = new Date(anchor);
    start.setHours(newHour, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000);
    setEvents((prev) => [
      createEvent({
        title: newTitle,
        categoryId: newCategory,
        start: start.toISOString(),
        end: end.toISOString(),
        outdoor: newOutdoor,
        pinnedDeadline: newPinned,
      }),
      ...prev,
    ]);
    setNewTitle("");
    setNewOutdoor(false);
    setNewPinned(false);
    note("Event added to calendar.");
  }

  function removeEvent(id: string, title?: string) {
    setEvents((prev) => deleteEvent(prev, id));
    note(title ? `Deleted “${title}”.` : "Event deleted.");
  }

  function moveAnchor(direction: -1 | 1) {
    if (view === "monthly") {
      setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1, 12));
      return;
    }
    const distance = view === "daily" ? 1 : view === "agenda" ? 14 : 7;
    setAnchor(addDays(anchor, direction * distance));
  }

  function EventChip({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
    const category = categoryById(categories, event.categoryId);
    const icon =
      (
        {
          meetings: "◎",
          personal: "☺",
          work: "▣",
          deadlines: "⚑",
          bills: "$",
          taxes: "§",
          "high-priority": "!",
          family: "⌂",
          school: "▤",
          travel: "✈",
          fitness: "✦",
        } as Record<string, string>
      )[category.id] || "•";
    return (
      <div
        className={`sc-event${compact ? " compact" : ""}${dragId === event.id ? " dragging" : ""}`}
        style={{ ["--sc-color" as string]: category.color }}
        draggable
        onDragStart={() => setDragId(event.id)}
        onDragEnd={() => setDragId(null)}
        title={`${category.label}: ${event.title} · drag to reschedule`}
      >
        <button
          type="button"
          className="sc-event-main"
          aria-label={`${category.label} event: ${event.title}`}
        >
          <strong>
            <span className="sc-event-icon" aria-hidden>
              {icon}
            </span>{" "}
            {compact ? event.title : `${formatTime(event.start)} · ${event.title}`}
          </strong>
          <small>
            {category.label}
            {!compact && event.location ? ` · ${event.location}` : ""}
            {!compact && event.invitees.length ? ` · ${event.invitees.join(", ")}` : ""}
          </small>
        </button>
        <button
          type="button"
          className="sc-event-delete"
          aria-label={`Delete ${event.title}`}
          onClick={(e) => {
            e.stopPropagation();
            removeEvent(event.id, event.title);
          }}
        >
          Delete
        </button>
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i));
  const monthDays = monthMatrix(anchor);
  const agendaDays = Array.from({ length: 14 }, (_, i) => addDays(anchor, i - 1));

  const navActions = (
    <div className="cta-row">
      <button
        type="button"
        className="btn btn-outline"
        onClick={() => moveAnchor(-1)}
      >
        Prev
      </button>
      <button type="button" className="btn btn-outline" onClick={() => setAnchor(new Date())}>
        Today
      </button>
      <button
        type="button"
        className="btn btn-dark"
        onClick={() => moveAnchor(1)}
      >
        Next
      </button>
    </div>
  );

  if (!ready) {
    if (embedded) return <div className="panel">Loading your planner…</div>;
    return (
      <AppShell title="Atlas Calendar" subtitle="Loading your planner…">
        <div className="panel">Loading…</div>
      </AppShell>
    );
  }

  const calendarBody = (
    <div className="smart-cal">
        <div className="sc-toolbar sc-toolbar-primary">
          <div className="calendar-view-switcher" role="tablist" aria-label="Calendar view">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                className={view === item.id ? "calendar-view-button active" : "calendar-view-button"}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="sc-anchor">{formatDayLabel(anchor)}</p>
        </div>

        {flash ? <p className="auth-success">{flash}</p> : null}

        <section className="calendar-summary" aria-label="Calendar summary">
          <div><strong>{eventsToday.length}</strong><span>Today</span></div>
          <div><strong>{upcomingCount}</strong><span>Next 7 days</span></div>
          <div><strong>{deadlines.length}</strong><span>Deadlines</span></div>
          <div className={conflicts.length ? "has-warning" : ""}>
            <strong>{conflicts.length}</strong><span>Conflicts</span>
          </div>
        </section>

        <div className="sc-layout">
          <div className="sc-main">
            {visibleEvents.length === 0 ? (
              <section className="panel calendar-empty-state">
                <div className="calendar-empty-icon" aria-hidden="true">□</div>
                <div>
                  <h2>Your calendar is ready</h2>
                  <p>No sample events were added. Create an event or connect a calendar to begin.</p>
                </div>
                <a className="btn btn-dark" href="#add-calendar-event">Add your first event</a>
              </section>
            ) : null}

            {view === "daily" ? (
              <section className="panel">
                <h2>Daily · {formatDayLabel(anchor)}</h2>
                <div className="sc-day-grid">
                  {HOURS.map((hour) => {
                    const slotEvents = eventsOnDay(visibleEvents, anchor).filter(
                      (event) => new Date(event.start).getHours() === hour,
                    );
                    return (
                      <div
                        key={hour}
                        className="sc-hour-row"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDropDay(anchor, hour)}
                      >
                        <strong>
                          {new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, {
                            hour: "numeric",
                          })}
                        </strong>
                        <div className="sc-hour-events">
                          {slotEvents.map((event) => (
                            <EventChip key={event.id} event={event} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {view === "weekly" ? (
              <section className="panel">
                <h2>Weekly planner</h2>
                <div className="sc-week-grid">
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`sc-week-col${sameDayLocal(day, new Date()) ? " today" : ""}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDropDay(day)}
                    >
                      <header>{formatDayLabel(day)}</header>
                      <div className="sc-week-events">
                        {eventsOnDay(visibleEvents, day).map((event) => (
                          <EventChip key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {view === "monthly" ? (
              <section className="panel">
                <h2>
                  Monthly ·{" "}
                  {anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </h2>
                <div className="sc-month-grid">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="sc-month-head">
                      {d}
                    </div>
                  ))}
                  {monthDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={`sc-month-cell${day.getMonth() !== anchor.getMonth() ? " muted" : ""}${sameDayLocal(day, new Date()) ? " today" : ""}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDropDay(day)}
                      onClick={() => {
                        setAnchor(day);
                        setView("daily");
                      }}
                    >
                      <span>{day.getDate()}</span>
                      {eventsOnDay(visibleEvents, day)
                        .slice(0, 3)
                        .map((event) => (
                          <EventChip key={event.id} event={event} compact />
                        ))}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {view === "agenda" ? (
              <section className="panel">
                <h2>Agenda</h2>
                <div className="sc-agenda">
                  {agendaDays.map((day) => {
                    const dayEvents = eventsOnDay(visibleEvents, day);
                    if (!dayEvents.length) return null;
                    return (
                      <div key={day.toISOString()} className="sc-agenda-day">
                        <h3>{formatDayLabel(day)}</h3>
                        <div
                          className="calendar"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => onDropDay(day)}
                        >
                          {dayEvents.map((event) => {
                            const category = categoryById(categories, event.categoryId);
                            return (
                              <div
                                className="cal-slot sc-agenda-slot"
                                key={event.id}
                                draggable
                                onDragStart={() => setDragId(event.id)}
                                onDragEnd={() => setDragId(null)}
                                style={{ borderLeftColor: category.color }}
                              >
                                <strong>{formatTime(event.start)}</strong>
                                <div>
                                  <div>{event.title}</div>
                                  <div style={{ color: "var(--ink-soft)", fontSize: "0.88rem" }}>
                                    {category.label}
                                    {event.location ? ` · ${event.location}` : ""}
                                    {event.invitees.length
                                      ? ` · with ${event.invitees.join(", ")}`
                                      : ""}
                                  </div>
                                </div>
                                <span className="badge">{event.priority}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="sc-side">
            <section className="panel calendar-add-panel" id="add-calendar-event">
              <div className="calendar-panel-heading">
                <div>
                  <p className="briefing-kicker">Quick create</p>
                  <h2>Add event</h2>
                </div>
                <span className="badge">{formatDayLabel(anchor)}</span>
              </div>
              <form className="form-grid" onSubmit={addManualEvent}>
                <label>
                  Event title
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Customer visit, meeting, deadline…"
                    required
                  />
                </label>
                <div className="calendar-form-row">
                  <label>
                    Category
                    <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Start
                    <select value={newHour} onChange={(e) => setNewHour(Number(e.target.value))}>
                      {HOURS.map((hour) => (
                        <option key={hour} value={hour}>
                          {new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: "numeric" })}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={newPinned}
                    onChange={(e) => setNewPinned(e.target.checked)}
                  />
                  Mark as a deadline
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={newOutdoor}
                    onChange={(e) => setNewOutdoor(e.target.checked)}
                  />
                  Outdoor event
                </label>
                <button className="btn btn-dark" type="submit">Add event</button>
              </form>
            </section>

            <section className="panel">
              <h2>Calendars</h2>
              <p className="panel-lead">Choose which schedules appear on the board.</p>
              <div className="sc-layers">
                {CALENDAR_LAYERS.map((layer) => {
                  const on = activeLayers.includes(layer.id);
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      className={on ? "sc-layer on" : "sc-layer"}
                      style={{ ["--sc-layer" as string]: layer.color }}
                      onClick={() => toggleLayer(layer.id)}
                      aria-pressed={on}
                    >
                      <span />
                      {layer.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <h2>Upcoming deadlines</h2>
              <ul className="manage-list">
                {deadlines.length === 0 ? (
                  <li className="calendar-list-empty">No upcoming deadlines.</li>
                ) : (
                  deadlines.slice(0, 6).map((event) => {
                    const category = categoryById(categories, event.categoryId);
                    return (
                      <li key={event.id}>
                        <div>
                          <strong>{event.title}</strong>
                          <small>{formatDayLabel(new Date(event.start))} · {category.label}</small>
                        </div>
                        <span className="badge warn">Due</span>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>

            <details className="panel calendar-disclosure">
              <summary>Atlas scheduling insights</summary>
              <div className="calendar-disclosure-body">
                <p className="panel-lead">
                  {freeGaps.length
                    ? `Open time today: ${freeGaps.map((gap) => `${gap.minutes}m`).join(", ")}`
                    : "No open work-hour gaps detected today."}
                </p>
                {conflicts.length ? (
                  <div className="sc-conflict">
                    {conflicts.slice(0, 3).map((conflict) => (
                      <p key={conflict.id}>{conflict.detail}</p>
                    ))}
                  </div>
                ) : (
                  <p className="account-hint">No schedule conflicts detected.</p>
                )}
                {suggestions.length ? (
                  <div className="sc-suggestions">
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <div key={suggestion.id} className="sc-suggestion">
                        <p>{suggestion.text}</p>
                        <button type="button" className="btn btn-outline" onClick={() => applySuggestion(suggestion)}>
                          {suggestion.actionLabel}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {reminders.length ? (
                  <ul className="manage-list">
                    {reminders.slice(0, 4).map((reminder) => (
                      <li key={reminder.id}><small>{reminder.text}</small></li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </details>

            <details className="panel calendar-disclosure">
              <summary>Categories and colors</summary>
              <div className="calendar-disclosure-body">
                <div className="sc-legend">
                  {categories.map((category) => (
                    <div key={category.id} className="sc-legend-item">
                      <span style={{ background: category.color }} />
                      <strong>{category.label}</strong>
                      {!category.builtIn ? (
                        <button
                          type="button"
                          className="ghost-link"
                          onClick={() => setCategories((prev) => prev.filter((item) => item.id !== category.id))}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <form className="form-grid" onSubmit={addCustomCategory}>
                  <label>
                    New category
                    <input
                      value={catLabel}
                      onChange={(e) => setCatLabel(e.target.value)}
                      placeholder="Callbacks"
                      required
                    />
                  </label>
                  <label>
                    Color
                    <input type="color" value={catColor} onChange={(e) => setCatColor(e.target.value)} />
                  </label>
                  <button className="btn btn-outline" type="submit">Add category</button>
                </form>
              </div>
            </details>
          </aside>
        </div>
      </div>
  );

  if (embedded) {
    return (
      <div>
        <div className="sc-toolbar" style={{ marginBottom: "0.75rem" }}>{navActions}</div>
        {calendarBody}
      </div>
    );
  }

  return (
    <AppShell
      title="Atlas Calendar"
      subtitle="Scheduling, AI planning, team meetings, deadlines, shifts, and milestones — Events AI lives here."
      action={navActions}
    >
      {calendarBody}
    </AppShell>
  );
}

function sameDayLocal(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
