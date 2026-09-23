"use client";

import Link from "@/components/SiteLink";
import { AppShell } from "@/components/AppShell";
import { SmartCalendarStudio } from "@/components/SmartCalendarStudio";

/** One calendar surface; related workflows remain connected destinations. */
export function AtlasCalendarStudio() {
  return (
    <AppShell
      title="Calendar"
      subtitle="Plan work, appointments, deadlines, and team commitments in one place."
      action={
        <a className="btn btn-dark" href="#add-calendar-event">
          Add event
        </a>
      }
    >
<<<<<<< HEAD
      <div className="training-studio">
        <div className="memory-card">
          <div className="label">Atlas Calendar · {SCOPES.find((s) => s.id === scope)?.label}</div>
          <p>{scopeHint}</p>
        </div>

        <div className="training-tabs" role="tablist" aria-label="Calendar views">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "training-tab active" : "training-tab"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "schedule" ? <SmartCalendarStudio embedded /> : null}
        {tab === "team" || tab === "company" ? <CalendarHubStudio /> : null}
        {tab === "meetings" ? (
          <section className="panel">
            <h2>Meetings</h2>
            <p className="panel-lead">Zoom, Teams, and in-person meetings with agendas and recaps.</p>
            <Link className="btn btn-dark" href="/app/appointments">Open Calendar</Link>
          </section>
        ) : null}
        {tab === "deadlines" ? (
          <section className="panel">
            <h2>Deadlines</h2>
            <p className="panel-lead">Due dates from projects, quotes, and tasks roll up here when connected.</p>
            <Link className="btn btn-dark" href="/app/projects">View projects</Link>
          </section>
        ) : null}
        {tab === "timeoff" ? (
          <section className="panel">
            <h2>Time off</h2>
            <p className="panel-lead">Employee requests, manager approvals, and coverage.</p>
            <Link className="btn btn-dark" href="/app/time-off">Open Time Off</Link>
          </section>
        ) : null}
        {tab === "events" ? <EventsStudio /> : null}
=======
      <div className="calendar-page">
        <nav className="calendar-shortcuts" aria-label="Related scheduling tools">
          <Link href="/app/meetings">Meetings</Link>
          <Link href="/app/time-off">Time off</Link>
          <Link href="/app/projects">Project deadlines</Link>
          <Link href="/app/connections">Calendar connections</Link>
        </nav>
        <SmartCalendarStudio embedded />
>>>>>>> origin/main
      </div>
    </AppShell>
  );
}
