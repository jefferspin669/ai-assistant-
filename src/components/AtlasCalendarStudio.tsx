"use client";

import Link from "@/components/SiteLink";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CalendarHubStudio } from "@/components/CalendarHubStudio";
import { EventsStudio } from "@/components/EventsStudio";
import { SmartCalendarStudio } from "@/components/SmartCalendarStudio";

const SCOPES = [
  { id: "personal", label: "Personal" },
  { id: "team", label: "Team" },
  { id: "company", label: "Company" },
] as const;

type ScopeId = (typeof SCOPES)[number]["id"];

const TABS = [
  { id: "schedule", label: "Schedule" },
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

function isScope(value: string | null): value is ScopeId {
  return SCOPES.some((scope) => scope.id === value);
}

function defaultTabForScope(scope: ScopeId): TabId {
  if (scope === "personal") return "schedule";
  if (scope === "team") return "team";
  return "company";
}

function AtlasCalendarStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scopeParam = searchParams.get("scope");
  const tabParam = searchParams.get("tab");
  const scope: ScopeId = isScope(scopeParam) ? scopeParam : "personal";
  const tab: TabId = isTab(tabParam) ? tabParam : defaultTabForScope(scope);

  const scopeHint = useMemo(() => {
    switch (scope) {
      case "personal":
        return "Your appointments, deadlines, reminders, and private calendar.";
      case "team":
        return "Department and project calendars — meetings, shifts, and milestones for your team.";
      default:
        return "Company-wide events, closures, training, and all-hands meetings.";
    }
  }, [scope]);

  function setScope(next: ScopeId) {
    router.replace(`/app/appointments?scope=${next}&tab=${defaultTabForScope(next)}`, { scroll: false });
  }

  function setTab(next: TabId) {
    router.replace(`/app/appointments?scope=${scope}&tab=${next}`, { scroll: false });
  }

  return (
    <AppShell
      title="Atlas Calendar"
      subtitle="One calendar — personal, team, company, meetings, deadlines, and time off."
      action={
        <div className="biz-switcher" role="group" aria-label="Calendar scope">
          {SCOPES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={scope === item.id ? "biz-tab active" : "biz-tab"}
              onClick={() => setScope(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
    >
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
    <Suspense fallback={<AppShell title="Atlas Calendar" subtitle="Loading…"><div className="panel">Loading…</div></AppShell>}>
      <AtlasCalendarStudioInner />
    </Suspense>
  );
}
