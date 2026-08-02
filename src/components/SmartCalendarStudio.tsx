"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAccount } from "@/components/AccountProvider";
import {
  CalendarIntelligencePanel,
  DailyPlannerBanner,
  ExternalCalendarsPanel,
  LifeTimelinePanel,
  SharedCalendarsPanel,
  VoiceCommandsPanel,
  useDailyPlan,
} from "@/components/calendar/CalendarExtrasPanels";
import {
  CALENDAR_LAYERS,
  HOURS,
  addDays,
  analyzeWeek,
  buildSmartReminders,
  buildSuggestions,
  buildWeatherInsights,
  categoryById,
  createCategory,
  createEvent,
  daysUntil,
  detectConflicts,
  eventsOnDay,
  filterEventsByLayers,
  findFreeGaps,
  formatDayLabel,
  formatTime,
  goalLabel,
  loadCalendarState,
  moveEventTo,
  pinnedDeadlines,
  progressBar,
  saveCalendarState,
  startOfMonth,
  startOfWeek,
  updateGoalProgress,
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
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
  { id: "timeline", label: "Timeline" },
  { id: "agenda", label: "Agenda" },
  { id: "life", label: "Life" },
];

function monthMatrix(anchor: Date) {
  const start = startOfMonth(anchor);
  const gridStart = startOfWeek(start);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function SmartCalendarStudio() {
  const { ownerName } = useAccount();
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
    const state = loadCalendarState();
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

  const dailyPlan = useDailyPlan(ownerName || "Kyle", events);

  const visibleEvents = useMemo(
    () => filterEventsByLayers(events, activeLayers),
    [events, activeLayers],
  );
  const conflicts = useMemo(() => detectConflicts(visibleEvents), [visibleEvents]);
  const suggestions = useMemo(() => buildSuggestions(visibleEvents, anchor), [visibleEvents, anchor]);
  const reminders = useMemo(() => buildSmartReminders(visibleEvents), [visibleEvents]);
  const freeGaps = useMemo(() => findFreeGaps(visibleEvents, anchor), [visibleEvents, anchor]);
  const deadlines = useMemo(() => pinnedDeadlines(visibleEvents), [visibleEvents]);
  const analysis = useMemo(() => analyzeWeek(visibleEvents, anchor), [visibleEvents, anchor]);
  const weather = useMemo(() => buildWeatherInsights(visibleEvents), [visibleEvents]);
  const visibleGoals = useMemo(
    () => goals.filter((goal) => activeLayers.includes(goal.layerId)),
    [goals, activeLayers],
  );

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
    note("Event added to Smart Calendar.");
  }

  function EventChip({ event, compact = false }: { event: CalendarEvent; compact?: boolean }) {
    const category = categoryById(categories, event.categoryId);
    return (
      <button
        type="button"
        className={`sc-event${compact ? " compact" : ""}${dragId === event.id ? " dragging" : ""}`}
        style={{ ["--sc-color" as string]: category.color }}
        draggable
        onDragStart={() => setDragId(event.id)}
        onDragEnd={() => setDragId(null)}
        title={`${event.title} · drag to reschedule`}
      >
        <strong>{compact ? event.title : `${formatTime(event.start)} · ${event.title}`}</strong>
        {!compact ? (
          <small>
            {category.label}
            {event.location ? ` · ${event.location}` : ""}
            {event.invitees.length ? ` · ${event.invitees.join(", ")}` : ""}
          </small>
        ) : null}
      </button>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i));
  const monthDays = monthMatrix(anchor);
  const yearMonths = Array.from({ length: 12 }, (_, i) => new Date(anchor.getFullYear(), i, 1));
  const agendaDays = Array.from({ length: 14 }, (_, i) => addDays(anchor, i - 1));

  if (!ready) {
    return (
      <AppShell title="Atlas Smart Calendar" subtitle="Loading your AI planner…">
        <div className="panel">Loading…</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Atlas Smart Calendar"
      subtitle="Voice commands, daily planning, shared calendars, pattern intelligence, and a searchable Life Timeline."
      action={
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() =>
              setAnchor(addDays(anchor, view === "yearly" ? -365 : view === "monthly" ? -30 : -7))
            }
            disabled={view === "life"}
          >
            Prev
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setAnchor(new Date())}>
            Today
          </button>
          <button
            type="button"
            className="btn btn-dark"
            onClick={() =>
              setAnchor(addDays(anchor, view === "yearly" ? 365 : view === "monthly" ? 30 : 7))
            }
            disabled={view === "life"}
          >
            Next
          </button>
        </div>
      }
    >
      <div className="smart-cal">
        <div className="sc-toolbar">
          <div className="biz-switcher">
            {VIEWS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={view === item.id ? "biz-chip active" : "biz-chip"}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="sc-anchor">{view === "life" ? "Life history" : formatDayLabel(anchor)}</p>
        </div>

        {flash ? <p className="auth-success">{flash}</p> : null}

        <DailyPlannerBanner plan={dailyPlan} />

        <div className="sc-layout">
          <div className="sc-main">
            {view === "life" ? <LifeTimelinePanel lifeTimeline={lifeTimeline} /> : null}

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

            {view === "yearly" ? (
              <section className="panel">
                <h2>Yearly · {anchor.getFullYear()}</h2>
                <div className="sc-year-grid">
                  {yearMonths.map((month) => {
                    const count = visibleEvents.filter(
                      (event) =>
                        new Date(event.start).getFullYear() === month.getFullYear() &&
                        new Date(event.start).getMonth() === month.getMonth(),
                    ).length;
                    return (
                      <button
                        key={month.toISOString()}
                        type="button"
                        className="sc-year-card"
                        onClick={() => {
                          setAnchor(month);
                          setView("monthly");
                        }}
                      >
                        <strong>
                          {month.toLocaleDateString(undefined, { month: "short" })}
                        </strong>
                        <span>{count} events</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {view === "timeline" ? (
              <section className="panel">
                <h2>Timeline</h2>
                <div className="sc-timeline">
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className="sc-timeline-row"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => onDropDay(day)}
                    >
                      <strong>{formatDayLabel(day)}</strong>
                      <div className="sc-timeline-track">
                        {eventsOnDay(visibleEvents, day).map((event) => {
                          const start = new Date(event.start);
                          const left = ((start.getHours() + start.getMinutes() / 60 - 7) / 12) * 100;
                          const width = (eventDurationMsHours(event) / 12) * 100;
                          const category = categoryById(categories, event.categoryId);
                          return (
                            <button
                              key={event.id}
                              type="button"
                              className="sc-timeline-block"
                              style={{
                                left: `${Math.max(0, left)}%`,
                                width: `${Math.max(8, width)}%`,
                                background: category.color,
                              }}
                              draggable
                              onDragStart={() => setDragId(event.id)}
                              onDragEnd={() => setDragId(null)}
                            >
                              {event.title}
                            </button>
                          );
                        })}
                      </div>
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
            <VoiceCommandsPanel
              events={events}
              setEvents={setEvents}
              onNote={note}
            />

            <ExternalCalendarsPanel onNote={note} />

            <SharedCalendarsPanel
              sharedMembers={sharedMembers}
              sharedRequests={sharedRequests}
              setSharedRequests={setSharedRequests}
              onNote={note}
            />

            <CalendarIntelligencePanel events={events} postponedTasks={postponedTasks} />

            {view !== "life" ? <LifeTimelinePanel lifeTimeline={lifeTimeline} compact /> : null}

            <section className="panel">
              <h2>Calendar layers</h2>
              <p className="panel-lead">Toggle calendars on or off to focus the planner.</p>
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
                    >
                      <span />
                      {layer.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="panel">
              <h2>Goal calendar</h2>
              <p className="panel-lead">Progress toward goals — not just events on a grid.</p>
              <div className="sc-goals">
                {visibleGoals.length === 0 ? (
                  <p className="account-hint">Turn on related layers to see goals.</p>
                ) : (
                  visibleGoals.map((goal) => (
                    <div key={goal.id} className="sc-goal">
                      <div className="sc-goal-head">
                        <strong>{goal.title}</strong>
                        <span>{goalLabel(goal)}</span>
                      </div>
                      {goal.kind === "progress" ? (
                        <div className="sc-goal-bar" aria-label={`${goal.progress}%`}>
                          <code>{progressBar(goal.progress)}</code>
                          <div className="cta-row">
                            <button
                              type="button"
                              className="ghost-link"
                              onClick={() =>
                                setGoals((prev) => updateGoalProgress(prev, goal.id, goal.progress + 5))
                              }
                            >
                              +5%
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="sc-goal-countdown">
                          {goal.targetDate
                            ? `${daysUntil(goal.targetDate)} days remaining`
                            : "No date set"}
                        </p>
                      )}
                      <small>{goal.detail}</small>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="panel">
              <h2>Deadline tracker</h2>
              <p className="panel-lead">Tax dates, payments, milestones, school work, renewals — pinned.</p>
              <ul className="manage-list">
                {deadlines.length === 0 ? (
                  <li>No upcoming pinned deadlines on active layers.</li>
                ) : (
                  deadlines.map((event) => {
                    const category = categoryById(categories, event.categoryId);
                    return (
                      <li key={event.id}>
                        <div>
                          <strong>{event.title}</strong>
                          <small>
                            {formatDayLabel(new Date(event.start))} · {category.label}
                            {event.location ? ` · ${event.location}` : ""}
                          </small>
                        </div>
                        <span className="badge warn">Pinned</span>
                      </li>
                    );
                  })
                )}
              </ul>
            </section>

            <section className="panel">
              <h2>AI time analysis</h2>
              <p className="panel-lead">{analysis.weekLabel}</p>
              <ul className="sc-time-list">
                {analysis.buckets.map((bucket) => (
                  <li key={bucket.id}>
                    <strong>{bucket.hours} hours</strong>
                    <span>{bucket.label}</span>
                  </li>
                ))}
              </ul>
              <div className="sc-suggestions">
                {analysis.suggestions.map((text) => (
                  <div key={text} className="sc-suggestion">
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Weather integration</h2>
              <ul className="manage-list">
                {weather.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.severity === "warn" ? "Advisory" : "Forecast"}</strong>
                      <small>{item.text}</small>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="panel">
              <h2>Color coding</h2>
              <p className="panel-lead">Atlas can auto-tag events — or invent your own colors.</p>
              <div className="sc-legend">
                {categories.map((category) => (
                  <div key={category.id} className="sc-legend-item">
                    <span style={{ background: category.color }} />
                    <strong>{category.label}</strong>
                    {!category.builtIn ? (
                      <button
                        type="button"
                        className="ghost-link"
                        onClick={() =>
                          setCategories((prev) => prev.filter((c) => c.id !== category.id))
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              <form className="form-grid" onSubmit={addCustomCategory}>
                <label>
                  Custom category
                  <input
                    value={catLabel}
                    onChange={(e) => setCatLabel(e.target.value)}
                    placeholder="Callbacks"
                    required
                  />
                </label>
                <label>
                  Color
                  <input
                    type="color"
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value)}
                  />
                </label>
                <button className="btn btn-outline" type="submit">
                  Add category
                </button>
              </form>
            </section>

            <section className="panel">
              <h2>AI scheduling</h2>
              <p className="panel-lead">
                Free gaps today:{" "}
                {freeGaps.length
                  ? freeGaps.map((g) => `${g.minutes}m`).join(", ")
                  : "none in work hours"}
              </p>
              {conflicts.length ? (
                <div className="sc-conflict">
                  {conflicts.slice(0, 3).map((conflict) => (
                    <p key={conflict.id}>{conflict.detail}</p>
                  ))}
                </div>
              ) : (
                <p className="account-hint">No conflicts on the board right now.</p>
              )}
              <div className="sc-suggestions">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="sc-suggestion">
                    <p>{suggestion.text}</p>
                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={() => applySuggestion(suggestion)}
                    >
                      {suggestion.actionLabel}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Smart reminders</h2>
              <ul className="manage-list">
                {reminders.length === 0 ? (
                  <li>No smart reminders for the next few hours.</li>
                ) : (
                  reminders.map((reminder) => (
                    <li key={reminder.id}>
                      <div>
                        <strong>{reminder.kind}</strong>
                        <small>{reminder.text}</small>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="panel">
              <h2>Add event</h2>
              <form className="form-grid" onSubmit={addManualEvent}>
                <label>
                  Title
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </label>
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
                  Start hour
                  <select
                    value={newHour}
                    onChange={(e) => setNewHour(Number(e.target.value))}
                  >
                    {HOURS.map((hour) => (
                      <option key={hour} value={hour}>
                        {new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, {
                          hour: "numeric",
                        })}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={newOutdoor}
                    onChange={(e) => setNewOutdoor(e.target.checked)}
                  />
                  Outdoor event (weather-aware)
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={newPinned}
                    onChange={(e) => setNewPinned(e.target.checked)}
                  />
                  Pin as deadline
                </label>
                <button className="btn btn-dark" type="submit">
                  Add to {formatDayLabel(anchor)}
                </button>
              </form>
              <p className="account-hint">Tip: drag any event onto another day or hour to reschedule.</p>
            </section>
          </aside>
        </div>
      </div>
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

function eventDurationMsHours(event: CalendarEvent) {
  return Math.max(0.5, (new Date(event.end).getTime() - new Date(event.start).getTime()) / 3600000);
}
