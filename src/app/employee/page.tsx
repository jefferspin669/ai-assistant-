"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getPresence,
  heartbeat,
  loadSignedInEmployee,
  loadTeamTasks,
  presenceState,
  saveEmployeeSession,
  saveTeamTasks,
  updatePresence,
  type EmployeePresence,
  type TeamPerson,
  type TeamTask,
} from "@/lib/user-workspace";

const statusLabels: Record<TeamTask["status"], string> = {
  todo: "To do",
  doing: "Working on it",
  done: "Done",
};

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<TeamPerson | null>(null);
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [presence, setPresence] = useState<EmployeePresence | null>(null);
  const [ready, setReady] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const employeeIdRef = useRef<string | null>(null);

  useEffect(() => {
    const me = loadSignedInEmployee();
    if (!me) {
      router.replace("/employee/login");
      return;
    }
    employeeIdRef.current = me.id;
    setEmployee(me);
    setTasks(loadTeamTasks().filter((task) => task.memberId === me.id));
    setPresence(getPresence(me.id));
    setReady(true);
  }, [router]);

  // Heartbeat so the owner sees this employee as live while the page is open.
  useEffect(() => {
    if (!ready) return;
    const timer = window.setInterval(() => {
      const id = employeeIdRef.current;
      if (!id) return;
      const current = getPresence(id);
      if (current.online) setPresence(heartbeat(id));
    }, 20000);
    return () => window.clearInterval(timer);
  }, [ready]);

  const state = presenceState(presence);
  const openTasks = useMemo(() => tasks.filter((t) => t.status !== "done"), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);

  const persistTasks = useCallback((memberId: string, nextForMember: TeamTask[]) => {
    setTasks(nextForMember);
    const others = loadTeamTasks().filter((task) => task.memberId !== memberId);
    saveTeamTasks([...nextForMember, ...others]);
  }, []);

  function clockIn() {
    if (!employee) return;
    setPresence(updatePresence(employee.id, { online: true, working: false }));
    setFlash("You're clocked in. Your manager can see you're online.");
  }

  function clockOut() {
    if (!employee) return;
    setPresence(updatePresence(employee.id, { online: false, working: false, currentTaskId: null }));
    setFlash("Clocked out. You're now shown as offline.");
  }

  function startWorking() {
    if (!employee) return;
    setPresence(updatePresence(employee.id, { online: true, working: true }));
    setFlash("Marked as actively working.");
  }

  function takeBreak() {
    if (!employee) return;
    setPresence(updatePresence(employee.id, { online: true, working: false }));
    setFlash("On a break — still online, not working.");
  }

  function setTaskStatus(task: TeamTask, status: TeamTask["status"]) {
    if (!employee) return;
    persistTasks(
      employee.id,
      tasks.map((t) => (t.id === task.id ? { ...t, status } : t)),
    );
    if (status === "doing") {
      setPresence(updatePresence(employee.id, { online: true, working: true, currentTaskId: task.id }));
    } else if (presence?.currentTaskId === task.id) {
      setPresence(updatePresence(employee.id, { currentTaskId: null, working: status === "done" ? false : presence.working }));
    }
  }

  function logout() {
    if (employee) updatePresence(employee.id, { online: false, working: false, currentTaskId: null });
    saveEmployeeSession(null);
    router.push("/employee/login");
  }

  if (!ready || !employee) {
    return (
      <div className="emp-shell">
        <div className="emp-main">
          <div className="container">
            <p className="muted-line">Loading your page…</p>
          </div>
        </div>
      </div>
    );
  }

  const currentTask = tasks.find((t) => t.id === presence?.currentTaskId) ?? null;

  return (
    <div className="emp-shell">
      <header className="emp-top">
        <div className="container">
          <div className="emp-id">
            <span className={`presence-dot ${state}`} aria-hidden />
            <span>
              <strong>{employee.name}</strong>
              <span>{employee.role}</span>
            </span>
          </div>
          <div className="emp-top-actions">
            <span className={`presence-badge ${state}`}>
              <span className={`presence-dot ${state}`} aria-hidden />
              {state === "working" ? "Working" : state === "break" ? "On break" : "Offline"}
            </span>
            <button className="btn btn-outline" type="button" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="emp-main">
        <div className="container">
          <section className="panel">
            <h2>My status</h2>
            <p className="panel-lead">
              Clock in so {`your manager`} can see you&apos;re online, then mark when you&apos;re actively working.
            </p>
            <div className="train-actions" style={{ marginTop: "0.5rem" }}>
              {state === "offline" ? (
                <button className="btn btn-dark" type="button" onClick={clockIn}>
                  Clock in
                </button>
              ) : (
                <>
                  {state === "working" ? (
                    <button className="btn btn-outline" type="button" onClick={takeBreak}>
                      Take a break
                    </button>
                  ) : (
                    <button className="btn btn-dark" type="button" onClick={startWorking}>
                      Start working
                    </button>
                  )}
                  <button className="btn btn-outline" type="button" onClick={clockOut}>
                    Clock out
                  </button>
                </>
              )}
            </div>
            {currentTask ? (
              <div className="memory-card" style={{ marginTop: "1rem" }}>
                <div className="label">Currently working on</div>
                <p>
                  <strong>{currentTask.title}</strong>
                </p>
                {currentTask.notes ? <p className="muted-line">{currentTask.notes}</p> : null}
              </div>
            ) : null}
            {flash ? (
              <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                {flash}
              </p>
            ) : null}
          </section>

          <div className="stat-grid metrics-dense">
            <div className="stat">
              <span>Open tasks</span>
              <strong>{openTasks.length}</strong>
              <small>Assigned to you</small>
            </div>
            <div className="stat">
              <span>Done</span>
              <strong>{doneTasks.length}</strong>
              <small>Completed</small>
            </div>
            <div className="stat">
              <span>Status</span>
              <strong style={{ fontSize: "1rem" }}>
                {state === "working" ? "Working" : state === "break" ? "On break" : "Offline"}
              </strong>
              <small>Right now</small>
            </div>
            <div className="stat">
              <span>Jobs</span>
              <strong>{employee.jobsThisWeek}</strong>
              <small>This week</small>
            </div>
          </div>

          <section className="panel">
            <h2>My tasks</h2>
            {tasks.length === 0 ? (
              <p className="muted-line">
                No tasks yet. When your manager assigns work in Atlas, it shows up here.
              </p>
            ) : (
              <div className="list">
                {[...openTasks, ...doneTasks].map((task) => (
                  <div className="list-row" key={task.id}>
                    <span
                      className={
                        task.status === "done"
                          ? "badge ok"
                          : task.status === "doing"
                            ? "badge warn"
                            : "badge"
                      }
                    >
                      {statusLabels[task.status]}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p>
                        <strong>{task.title}</strong>
                      </p>
                      {task.notes ? <small className="muted-line">{task.notes}</small> : null}
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => setTaskStatus(task, e.target.value as TeamTask["status"])}
                      aria-label={`Update status for ${task.title}`}
                    >
                      <option value="todo">To do</option>
                      <option value="doing">Working on it</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="muted-line">
            Need to switch accounts? <Link href="/employee/login">Back to employee sign-in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
