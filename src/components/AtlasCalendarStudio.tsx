"use client";

import Link from "@/components/SiteLink";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CalendarHubStudio } from "@/components/CalendarHubStudio";
import { EventsStudio } from "@/components/EventsStudio";
import { SmartCalendarStudio } from "@/components/SmartCalendarStudio";

const TABS = [
  { id: "schedule", label: "Personal" },
  { id: "team", label: "Team" },
  { id: "company", label: "Company" },
  { id: "meetings", label: "Meetings" },
  { id: "deadlines", label: "Deadlines" },
  { id: "timeoff", label: "Time off" },
  { id: "events", label: "Celebrations" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function AtlasCalendarStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "schedule";

  const scopeHint = useMemo(() => {
    switch (tab) {
      case "schedule":
        return "Your appointments, reminders, and private schedule.";
      case "team":
        return "Team calendars — shifts, meetings, and shared milestones.";
      case "company":
        return "Company-wide events, closures, and all-hands.";
      case "meetings":
        return "Meeting intelligence, agendas, and recaps.";
      case "deadlines":
        return "Project deadlines and due dates across the business.";
      case "timeoff":
        return "PTO requests, approvals, and coverage planning.";
      default:
        return "Celebrations and company events.";
    }
  }, [tab]);

  function setTab(next: TabId) {
    router.replace(`/app/appointments?tab=${next}`, { scroll: false });
  }

  return (
    <AppShell
      title="Calendar"
      subtitle="One calendar — personal, team, company, meetings, deadlines, and time off."
    >
      <div className="training-studio">
        <div className="memory-card">
          <div className="label">Calendar · {TABS.find((t) => t.id === tab)?.label}</div>
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
            <Link className="btn btn-dark" href="/app/meetings">Open Meeting Intelligence</Link>
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
      </div>
    </AppShell>
  );
}

export function AtlasCalendarStudio() {
  return (
    <Suspense fallback={<AppShell title="Calendar" subtitle="Loading…"><div className="panel">Loading…</div></AppShell>}>
      <AtlasCalendarStudioInner />
    </Suspense>
  );
}
