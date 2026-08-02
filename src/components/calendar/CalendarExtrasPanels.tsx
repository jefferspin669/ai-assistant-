"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  LIFE_QUERY_EXAMPLES,
  VOICE_EXAMPLES,
  applyVoiceCommand,
  assignSharedTask,
  buildDailyPlan,
  buildIntelligenceInsights,
  lifeKindLabel,
  searchLifeTimeline,
  updateSharedRequestStatus,
  type DailyPlan,
  type IntelligenceInsight,
  type LifeSearchResult,
} from "@/lib/calendar-intelligence";
import {
  formatDayLabel,
  type CalendarEvent,
  type LifeEntry,
  type PostponedCalendarTask,
  type SharedCalendarMember,
  type SharedCalendarRequest,
} from "@/lib/smart-calendar";

type Props = {
  ownerName: string;
  events: CalendarEvent[];
  setEvents: (updater: (prev: CalendarEvent[]) => CalendarEvent[]) => void;
  sharedMembers: SharedCalendarMember[];
  sharedRequests: SharedCalendarRequest[];
  setSharedRequests: (updater: (prev: SharedCalendarRequest[]) => SharedCalendarRequest[]) => void;
  lifeTimeline: LifeEntry[];
  postponedTasks: PostponedCalendarTask[];
  onNote: (message: string) => void;
};

export function DailyPlannerBanner({ plan }: { plan: DailyPlan }) {
  return (
    <section className="panel sc-daily-plan" aria-label="AI Daily Planner">
      <p className="briefing-kicker">AI Daily Planner</p>
      <h2>{plan.greeting}</h2>
      <p className="panel-lead">You have:</p>
      <ul className="sc-plan-list">
        {plan.items.map((item) => (
          <li key={item.label}>
            <strong>{item.count}</strong> {item.label}
          </li>
        ))}
      </ul>
      <div className="sc-plan-priorities">
        <p className="panel-lead">Recommended priority:</p>
        <ol>
          {plan.priorities.map((item) => (
            <li key={item.rank}>
              <strong>
                {item.rank}. {item.title}
              </strong>
              <small>{item.reason}</small>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function VoiceCommandsPanel({
  events,
  setEvents,
  onNote,
}: {
  events: CalendarEvent[];
  setEvents: Props["setEvents"];
  onNote: Props["onNote"];
}) {
  const [voice, setVoice] = useState(VOICE_EXAMPLES[0]);
  const [lastReply, setLastReply] = useState("");

  function runVoice(command: string) {
    const result = applyVoiceCommand(events, command);
    setEvents(() => result.events);
    setLastReply(result.message);
    onNote(result.message);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runVoice(voice);
  }

  return (
    <section className="panel">
      <h2>Voice commands</h2>
      <p className="panel-lead">Speak naturally — Atlas matches keywords and updates the calendar.</p>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Say something
          <input
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            placeholder='Atlas, schedule a dentist appointment next Friday.'
          />
        </label>
        <button className="btn btn-dark" type="submit">
          Run voice command
        </button>
      </form>
      {lastReply ? <p className={lastReply.startsWith("I didn’t") || lastReply.startsWith("Say a") ? "auth-error" : "auth-success"}>{lastReply}</p> : null}
      <div className="sc-example-chips">
        {VOICE_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="sc-example-chip"
            onClick={() => {
              setVoice(example);
              runVoice(example);
            }}
          >
            {example}
          </button>
        ))}
      </div>
    </section>
  );
}

export function SharedCalendarsPanel({
  sharedMembers,
  sharedRequests,
  setSharedRequests,
  onNote,
}: {
  sharedMembers: SharedCalendarMember[];
  sharedRequests: SharedCalendarRequest[];
  setSharedRequests: Props["setSharedRequests"];
  onNote: Props["onNote"];
}) {
  const [taskDetail, setTaskDetail] = useState("Review HomeBase dashboard before Friday.");
  const [assignee, setAssignee] = useState(sharedMembers.find((m) => m.role !== "owner")?.name || "Alex Rivera");

  function respond(id: string, status: SharedCalendarRequest["status"]) {
    setSharedRequests((prev) => updateSharedRequestStatus(prev, id, status));
    onNote(status === "approved" ? "Request approved." : "Request declined.");
  }

  function onAssign(e: FormEvent) {
    e.preventDefault();
    if (!taskDetail.trim()) return;
    setSharedRequests((prev) => assignSharedTask(prev, assignee, taskDetail.trim()));
    setTaskDetail("");
    onNote(`Task assigned to ${assignee}.`);
  }

  return (
    <section className="panel">
      <h2>Shared calendars</h2>
      <p className="panel-lead">
        Perfect for businesses and families — assign tasks, share schedules, request availability, approve
        vacations, and track project deadlines.
      </p>
      <div className="sc-shared-members">
        {sharedMembers.map((member) => (
          <div key={member.id} className="sc-shared-member">
            <strong>{member.name}</strong>
            <span>
              {member.role} · {member.calendarLabel}
            </span>
            <em className={member.status === "active" ? "ok" : ""}>{member.status}</em>
          </div>
        ))}
      </div>
      <form className="form-grid" onSubmit={onAssign}>
        <label>
          Assign task to
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            {sharedMembers
              .filter((m) => m.role !== "owner")
              .map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Task
          <input value={taskDetail} onChange={(e) => setTaskDetail(e.target.value)} required />
        </label>
        <button className="btn btn-outline" type="submit">
          Assign task
        </button>
      </form>
      <ul className="manage-list">
        {sharedRequests.map((req) => (
          <li key={req.id}>
            <div>
              <strong>
                {req.kind} · {req.from}
              </strong>
              <small>{req.detail}</small>
            </div>
            {req.status === "pending" ? (
              <div className="cta-row">
                <button type="button" className="btn btn-dark" onClick={() => respond(req.id, "approved")}>
                  Approve
                </button>
                <button type="button" className="btn btn-outline" onClick={() => respond(req.id, "declined")}>
                  Decline
                </button>
              </div>
            ) : (
              <span className="badge">{req.status}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CalendarIntelligencePanel({
  events,
  postponedTasks,
}: {
  events: CalendarEvent[];
  postponedTasks: PostponedCalendarTask[];
}) {
  const insights = useMemo(
    () => buildIntelligenceInsights(events, postponedTasks),
    [events, postponedTasks],
  );

  return (
    <section className="panel">
      <h2>Calendar intelligence</h2>
      <p className="panel-lead">Atlas notices patterns over time.</p>
      <div className="sc-insights">
        {insights.map((insight: IntelligenceInsight) => (
          <div key={insight.id} className={`sc-insight kind-${insight.kind}`}>
            <span>{insight.kind}</span>
            <p>{insight.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function LifeTimelinePanel({
  lifeTimeline,
  compact = false,
}: {
  lifeTimeline: LifeEntry[];
  compact?: boolean;
}) {
  const [query, setQuery] = useState(LIFE_QUERY_EXAMPLES[0]);
  const [result, setResult] = useState<LifeSearchResult>(() =>
    searchLifeTimeline(lifeTimeline, ""),
  );

  function runSearch(value: string) {
    setQuery(value);
    setResult(searchLifeTimeline(lifeTimeline, value));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  const entries = result.entries.length ? result.entries : lifeTimeline.slice(0, compact ? 5 : 12);

  return (
    <section className={compact ? "panel" : "panel sc-life-panel"}>
      <h2>Life Timeline</h2>
      <p className="panel-lead">
        Searchable history of jobs, trips, purchases, taxes, medical visits, launches, milestones, and more —
        not just future events.
      </p>
      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          Ask Atlas
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="When did I start working at JB Hunt?"
          />
        </label>
        <button className="btn btn-dark" type="submit">
          Search history
        </button>
      </form>
      <p className="auth-success">{result.answer}</p>
      <div className="sc-example-chips">
        {LIFE_QUERY_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            className="sc-example-chip"
            onClick={() => runSearch(example)}
          >
            {example}
          </button>
        ))}
      </div>
      <div className="sc-life-list">
        {entries.map((entry) => (
          <article key={entry.id} className="sc-life-entry">
            <header>
              <span>{lifeKindLabel(entry.kind)}</span>
              <time dateTime={entry.date}>{formatDayLabel(new Date(entry.date))}</time>
            </header>
            <strong>{entry.title}</strong>
            <p>{entry.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function useDailyPlan(ownerName: string, events: CalendarEvent[]) {
  return useMemo(() => buildDailyPlan(ownerName, events), [ownerName, events]);
}
