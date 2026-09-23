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
      <div className="calendar-page">
        <nav className="calendar-shortcuts" aria-label="Related scheduling tools">
          <Link href="/app/meetings">Meetings</Link>
          <Link href="/app/time-off">Time off</Link>
          <Link href="/app/projects">Project deadlines</Link>
          <Link href="/app/connections">Calendar connections</Link>
        </nav>
        <SmartCalendarStudio embedded />
      </div>
    </AppShell>
  );
}
