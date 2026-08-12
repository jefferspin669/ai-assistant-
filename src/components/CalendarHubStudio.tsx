"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  audienceLabel,
  audienceMembers,
  CAL_EVENT_KINDS,
  createCalEvent,
  createCalendar,
  loadCalEvents,
  loadCalendars,
  loadTeamMembers,
  overlayOf,
  scheduleCompanyMeeting,
  seedCalendarsIfEmpty,
  seedDemoTeamIfEmpty,
  type Audience,
  type CalEvent,
  type CalEventKind,
  type CalendarKind,
  type CalOverlay,
  type SharedCalendar,
  type TeamPerson,
} from "@/lib/user-workspace";

type AudienceKind = Audience["kind"];
const KIND_OPTIONS: { id: AudienceKind; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "managers", label: "Managers only" },
  { id: "working", label: "Currently working" },
  { id: "department", label: "Department…" },
  { id: "location", label: "Location…" },
  { id: "project", label: "Project…" },
  { id: "members", label: "Specific people…" },
];
const OVERLAYS: { id: CalOverlay; label: string }[] = [
  { id: "mine", label: "My Calendar" },
  { id: "team", label: "My Team" },
  { id: "company", label: "Company Events" },
  { id: "projects", label: "Projects" },
  { id: "training", label: "Training" },
];
const kindEmoji = (k: CalEventKind) => CAL_EVENT_KINDS.find((x) => x.id === k)?.emoji ?? "•";

export function CalendarHubStudio() {
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Compose event.
  const [calendarId, setCalendarId] = useState("company");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CalEventKind>("meeting");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [aud, setAud] = useState<AudienceKind>("all");
  const [audDept, setAudDept] = useState("");
  const [audLoc, setAudLoc] = useState("");
  const [audProj, setAudProj] = useState("");
  const [audPicked, setAudPicked] = useState<string[]>([]);
  const [schedCmd, setSchedCmd] = useState("Schedule a company meeting Friday at 10 AM");
  const [enabled, setEnabled] = useState<Record<CalOverlay, boolean>>({ mine: true, team: true, company: true, projects: true, training: true });

  // Create calendar.
  const [newCalName, setNewCalName] = useState("");
  const [newCalKind, setNewCalKind] = useState<CalendarKind>("department");

  const refresh = useCallback(() => {
    setCalendars(loadCalendars());
    setEvents(loadCalEvents());
    setMembers(loadTeamMembers());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    seedCalendarsIfEmpty();
    refresh();
    setReady(true);
  }, [refresh]);

  const departments = useMemo(() => [...new Set(members.map((m) => m.department).filter(Boolean) as string[])], [members]);
  const locations = useMemo(() => [...new Set(members.map((m) => m.location).filter(Boolean) as string[])], [members]);
  const projects = useMemo(() => ["Johnson Expansion", "Website Launch"], []);

  const audience: Audience = useMemo(() => {
    switch (aud) {
      case "department": return { kind: "department", value: audDept || departments[0] || "" };
      case "location": return { kind: "location", value: audLoc || locations[0] || "" };
      case "project": return { kind: "project", value: audProj || projects[0] };
      case "members": return { kind: "members", ids: audPicked };
      default: return { kind: aud } as Audience;
    }
  }, [aud, audDept, audLoc, audProj, audPicked, departments, locations, projects]);
  const reach = useMemo(() => audienceMembers(audience).length, [audience]);

  const privateCal = calendars.find((c) => c.kind === "private");
  const visibleEvents = useMemo(() => events.filter((e) => e.calendarId !== privateCal?.id && enabled[overlayOf(e)]), [events, privateCal, enabled]);
  const privateEvents = useMemo(() => events.filter((e) => e.calendarId === privateCal?.id), [events, privateCal]);
  const byDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of visibleEvents) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [visibleEvents]);

  function addEvent(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) { setNote("Add a title and date."); return; }
    createCalEvent({ calendarId, title, kind, date, time, audience });
    refresh();
    setNote(`Added “${title}” to ${calendars.find((c) => c.id === calendarId)?.name} for ${audienceLabel(audience)} (${reach}).`);
    setTitle(""); setTime("");
  }

  function askSchedule() {
    if (!schedCmd.trim()) return;
    const ev = scheduleCompanyMeeting(schedCmd);
    refresh();
    setNote(`Atlas scheduled “${ev.title}” on the Company Calendar for everyone (${audienceMembers({ kind: "all" }).length}) on ${ev.date}${ev.time ? ` at ${ev.time}` : ""}. Your private CEO calendar is untouched.`);
  }

  function addCalendar(e: FormEvent) {
    e.preventDefault();
    if (!newCalName.trim()) return;
    createCalendar({ name: newCalName, kind: newCalKind, audience });
    refresh();
    setNote(`Created the “${newCalName}” calendar for ${audienceLabel(audience)}.`);
    setNewCalName("");
  }

  const dayLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="training-studio">
      {note ? <div className="memory-card"><div className="label">Atlas</div><p>{note}</p></div> : null}

      <div className="split">
        <section className="panel">
          <h2>Add to a calendar</h2>
          <p className="panel-lead">Choose exactly who can see each event — employees only see what they&apos;re allowed to.</p>
          <form onSubmit={addEvent}>
            <div className="field-row">
              <label style={{ flex: 1 }}>Calendar<select value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>{calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label>Type<select value={kind} onChange={(e) => setKind(e.target.value as CalEventKind)}>{CAL_EVENT_KINDS.map((k) => <option key={k.id} value={k.id}>{k.emoji} {k.label}</option>)}</select></label>
            </div>
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Team meeting, milestone, closure…" /></label>
            <div className="field-row">
              <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
              <label>Time<input value={time} onChange={(e) => setTime(e.target.value)} placeholder="10:00 AM (optional)" /></label>
            </div>
            <div className="field-row">
              <label style={{ flex: 1 }}>Who sees it<select value={aud} onChange={(e) => setAud(e.target.value as AudienceKind)}>{KIND_OPTIONS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select></label>
              {aud === "department" ? <label>Dept<select value={audDept} onChange={(e) => setAudDept(e.target.value)}>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select></label> : null}
              {aud === "location" ? <label>Location<select value={audLoc} onChange={(e) => setAudLoc(e.target.value)}>{locations.map((l) => <option key={l} value={l}>{l}</option>)}</select></label> : null}
              {aud === "project" ? <label>Project<select value={audProj} onChange={(e) => setAudProj(e.target.value)}>{projects.map((p) => <option key={p} value={p}>{p}</option>)}</select></label> : null}
            </div>
            {aud === "members" ? (
              <div className="status-picker" style={{ marginBottom: "0.5rem" }}>
                {members.map((m) => { const on = audPicked.includes(m.id); return <button key={m.id} type="button" className={on ? "status-chip active" : "status-chip"} onClick={() => setAudPicked((p) => on ? p.filter((x) => x !== m.id) : [...p, m.id])}>{m.name}</button>; })}
              </div>
            ) : null}
            <p className="muted-line">👁️ Visible to <strong>{reach}</strong> employee{reach === 1 ? "" : "s"} — {audienceLabel(audience)}.</p>
            <button className="btn btn-dark" type="submit">Add event</button>
          </form>

          <div className="memory-card" style={{ marginTop: "0.8rem" }}>
            <div className="label">🤖 Ask Atlas to schedule</div>
            <form className="command-form" onSubmit={(e) => { e.preventDefault(); askSchedule(); }}>
              <input value={schedCmd} onChange={(e) => setSchedCmd(e.target.value)} placeholder="Schedule a company meeting Friday at 10 AM" />
              <button className="btn btn-outline" type="submit">Schedule</button>
            </form>
            <p className="muted-line">Atlas puts it on the Company Calendar, invites everyone who should attend, and keeps your private CEO calendar separate.</p>
          </div>
        </section>

        <section className="panel">
          <h2>Calendars</h2>
          <p className="panel-lead">The company, private CEO, and shared team/department/project calendars.</p>
          <div className="list">
            {calendars.map((c) => (
              <div className="list-row" key={c.id}>
                <span className={c.kind === "private" ? "badge warn" : "badge"}>{c.kind === "private" ? "🔒" : c.kind === "company" ? "🏢" : "👥"}</span>
                <p><strong>{c.name}</strong><span className="muted-line">{c.kind === "private" ? "Private to the CEO" : audienceLabel(c.audience)}</span></p>
              </div>
            ))}
          </div>
          <form className="field-row" style={{ marginTop: "0.6rem", alignItems: "flex-end" }} onSubmit={addCalendar}>
            <label style={{ flex: 1 }}>New calendar<input value={newCalName} onChange={(e) => setNewCalName(e.target.value)} placeholder="Sales Calendar" /></label>
            <label>Kind<select value={newCalKind} onChange={(e) => setNewCalKind(e.target.value as CalendarKind)}><option value="department">Department</option><option value="team">Team</option><option value="project">Project</option><option value="location">Location</option><option value="custom">Custom</option></select></label>
            <button className="btn btn-outline" type="submit">Create</button>
          </form>
          <p className="muted-line" style={{ marginTop: "0.3rem" }}>New calendars use the &ldquo;Who sees it&rdquo; audience selected on the left.</p>
        </section>
      </div>

      <section className="panel">
        <div className="train-head">
          <div>
            <h2>Agenda</h2>
            <p className="panel-lead">Toggle overlays to keep it uncluttered.</p>
          </div>
        </div>
        <div className="status-picker" style={{ marginBottom: "0.6rem" }}>
          {OVERLAYS.map((o) => (
            <button key={o.id} type="button" className={enabled[o.id] ? "status-chip active" : "status-chip"} onClick={() => setEnabled((s) => ({ ...s, [o.id]: !s[o.id] }))}>{enabled[o.id] ? "☑" : "☐"} {o.label}</button>
          ))}
        </div>
        {!ready ? <p className="muted-line">Loading…</p> : null}
        {ready && byDate.length === 0 ? <p className="muted-line">No events for the selected overlays.</p> : null}
        {byDate.map(([iso, evs]) => (
          <div key={iso} style={{ marginBottom: "0.8rem" }}>
            <div className="label">{dayLabel(iso)}</div>
            <div className="list">
              {evs.map((e) => (
                <div className="list-row" key={e.id}>
                  <span className="badge">{kindEmoji(e.kind)}</span>
                  <div style={{ flex: 1 }}>
                    <p><strong>{e.time ? `${e.time} · ` : ""}{e.title}</strong><span className="muted-line">{calendars.find((c) => c.id === e.calendarId)?.name ?? "Calendar"} · {audienceLabel(e.audience)}{e.source === "atlas" ? " · auto-added by Atlas" : ""}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {privateEvents.length ? (
        <section className="panel" style={{ borderLeft: "4px solid var(--rust, #b4532a)" }}>
          <h2>🔒 {privateCal?.name}</h2>
          <p className="panel-lead">Only you can see these — never shared with employees.</p>
          <div className="list">
            {privateEvents.map((e) => (
              <div className="list-row" key={e.id}>
                <span className="badge warn">{kindEmoji(e.kind)}</span>
                <p><strong>{e.time ? `${e.time} · ` : ""}{e.title}</strong><span className="muted-line">{dayLabel(e.date)}</span></p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
