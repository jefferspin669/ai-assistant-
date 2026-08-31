"use client";

import Link from "@/components/SiteLink";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TaskAssignmentStudio } from "@/components/TaskAssignmentStudio";
import { digitalEmployeeRoster } from "@/lib/atlas-platform";
import {
  createTaskFromSuggestion,
  detectTaskSuggestions,
  isOpenTask,
  loadTeamMembers,
  loadTeamTasks,
  resolveDue,
  saveTeamTasks,
  seedDemoTeamIfEmpty,
  todayISO,
  type TaskSuggestion,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

const TABS = [
  { id: "team", label: "Team" },
  { id: "tasks", label: "Assign & Tasks" },
  { id: "ai-workers", label: "AI Workers" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function taskStats(memberId: string, tasks: TeamTask[], today: string) {
  const mine = tasks.filter((t) => t.memberId === memberId);
  const active = mine.filter((t) => isOpenTask(t.status));
  const dueToday = active.filter((t) => t.dueDate?.slice(0, 10) === today).length;
  return { active: active.length, dueToday };
}

function parseBossDirective(text: string, members: TeamPerson[]): TaskSuggestion | null {
  const match = text.match(/^([A-Za-z]+),\s*(.+)$/);
  if (!match) return null;
  const member = members.find((m) => m.name.toLowerCase().startsWith(match[1].toLowerCase()));
  if (!member) return null;
  const action = match[2].trim();
  const due = resolveDue(action);
  const title = action.replace(/\bby\s+.+$/i, "").trim();
  return {
    id: "boss",
    title: title.length > 70 ? `${title.slice(0, 67)}…` : title,
    assigneeId: member.id,
    assigneeName: member.name,
    dueLabel: due.label,
    dueDate: due.date,
    source: text,
  };
}

function WorkforceStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "team";

  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [bossCmd, setBossCmd] = useState(
    "Sarah, contact the Johnson account and prepare a renewal quote by Thursday.",
  );
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const today = todayISO();

  const refresh = useCallback(() => {
    setMembers(loadTeamMembers());
    setTasks(loadTeamTasks());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    refresh();
    setReady(true);
  }, [refresh]);

  const workload = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (!isOpenTask(t.status)) continue;
      map.set(t.memberId, (map.get(t.memberId) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  function setTab(next: TabId) {
    router.replace(`/app/workforce?tab=${next}`, { scroll: false });
  }

  function onBossCommand(e: FormEvent) {
    e.preventDefault();
    const text = bossCmd.trim();
    if (!text) return;
    const suggestions = detectTaskSuggestions(text, members);
    const directive = parseBossDirective(text, members);
    const pick = directive ?? suggestions[0];
    if (pick) {
      const task = createTaskFromSuggestion(pick, members[0]?.id ?? "", "Boss");
      saveTeamTasks([task, ...loadTeamTasks()]);
      refresh();
      const assignee = members.find((m) => m.id === task.memberId);
      setNote(
        `Atlas created a task for ${assignee?.name ?? "the assignee"}: “${task.title}”${task.dueDate ? ` · due ${task.dueDate}` : ""}. Notification and calendar item queued.`,
      );
      setTab("tasks");
      return;
    }
    setNote("Atlas could not match a team member — try starting with their first name, e.g. “Sarah, …”.");
  }

  function suggestAssignee() {
    const sorted = [...members].sort((a, b) => (workload.get(a.id) ?? 0) - (workload.get(b.id) ?? 0));
    const pick = sorted[0];
    if (!pick) return;
    setNote(
      `Atlas suggests ${pick.name} (${pick.role}) — ${workload.get(pick.id) ?? 0} open tasks, lightest workload on the team.`,
    );
  }

  return (
    <AppShell
      title="Workforce"
      subtitle="Real employees, managers, AI workers, tasks, messaging, and workload — one hub."
    >
      <div className="training-studio">
        {note ? (
          <div className="memory-card">
            <div className="label">Atlas</div>
            <p>{note}</p>
          </div>
        ) : null}

        <section className="panel">
          <h2>Assign with natural language</h2>
          <p className="panel-lead">
            Tell Atlas who should do what — it becomes a task, deadline, notification, and calendar item.
          </p>
          <form className="command-form" onSubmit={onBossCommand}>
            <input
              value={bossCmd}
              onChange={(e) => setBossCmd(e.target.value)}
              placeholder="Sarah, contact the Johnson account and prepare a renewal quote by Thursday."
            />
            <button className="btn btn-dark" type="submit">Assign with Atlas</button>
            <button className="btn btn-outline" type="button" onClick={suggestAssignee}>
              Suggest assignee
            </button>
          </form>
        </section>

        <div className="training-tabs" role="tablist" aria-label="Workforce">
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

        {tab === "team" ? (
          <div className="module-grid">
            {!ready ? <p className="muted-line">Loading team…</p> : null}
            {members.map((person) => {
              const stats = taskStats(person.id, tasks, today);
              return (
                <section className="panel audience-card" key={person.id}>
                  <h2>{person.name}</h2>
                  <p className="muted-line">{person.role}</p>
                  <p>
                    <strong>{stats.active}</strong> active task{stats.active === 1 ? "" : "s"}
                    {stats.dueToday > 0 ? ` · ${stats.dueToday} due today` : ""}
                  </p>
                  <div className="cta-row" style={{ marginTop: "0.75rem" }}>
                    <Link className="btn btn-outline" href={`/app/messages?to=${encodeURIComponent(person.id)}`}>
                      Message
                    </Link>
                    <button
                      className="btn btn-outline"
                      type="button"
                      onClick={() => {
                        setBossCmd(`${person.name.split(" ")[0]}, `);
                        setTab("tasks");
                      }}
                    >
                      Assign work
                    </button>
                    <Link className="btn btn-dark" href={`/app/appointments?scope=team&tab=team`}>
                      View schedule
                    </Link>
                  </div>
                  <p className="account-hint" style={{ marginTop: "0.5rem" }}>
                    Status flow: To Do → In Progress → Review → Complete
                  </p>
                </section>
              );
            })}
            <Link className="panel audience-card" href="/app/teams">
              <h2>+ Invite employee</h2>
              <p>Add people with their own pages and permissions.</p>
            </Link>
            <Link className="panel audience-card" href="/app/workforce-status">
              <h2>Workforce status</h2>
              <p>See who&apos;s online and what they&apos;re working on.</p>
            </Link>
          </div>
        ) : null}

        {tab === "tasks" ? <TaskAssignmentStudio /> : null}

        {tab === "ai-workers" ? (
          <>
            <section className="panel">
              <h2>AI workers alongside your team</h2>
              <p className="panel-lead">
                Specialized digital teammates share the same business memory. Atlas routes work to the right
                specialist — you still talk to Atlas.
              </p>
            </section>
            <div className="list">
              {digitalEmployeeRoster.map((worker) => (
                <div className="list-row" key={worker.title}>
                  <span>
                    <strong>{worker.emoji} {worker.title}</strong>
                    <small className="muted-line">{worker.expertise}</small>
                  </span>
                  <Link className="btn btn-outline" href="/app/marketplace?tab=agents">
                    Configure
                  </Link>
                </div>
              ))}
            </div>
            <p className="account-hint">
              Install more agents from the <Link href="/app/marketplace?tab=agents">Marketplace</Link>.
            </p>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

export function WorkforceStudio() {
  return (
    <Suspense
      fallback={
        <AppShell title="Workforce" subtitle="Loading…">
          <div className="panel">Loading…</div>
        </AppShell>
      }
    >
      <WorkforceStudioInner />
    </Suspense>
  );
}
