"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  addProjectComment,
  addProjectTask,
  aiSuggestionsForProject,
  assessProjectRisks,
  createAtlasProject,
  generateProjectPlanFromPrompt,
  loadAtlasProjects,
  loadProjectFolders,
  seedProjectsIfEmpty,
  updateAtlasProject,
  workloadByMember,
  type AtlasProject,
  type ProjectTaskStatus,
} from "@/lib/projects-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty, type TeamPerson } from "@/lib/user-workspace";

const STATUS_LABELS: Record<ProjectTaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  completed: "Complete",
  blocked: "Blocked",
};

type Mode = "projects" | "workload" | "plan";

export function ProjectStudio() {
  const [projects, setProjects] = useState<AtlasProject[]>([]);
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [mode, setMode] = useState<Mode>("projects");
  const [planPrompt, setPlanPrompt] = useState(
    "Build me a launch plan for the new website and divide the work between my marketing and development teams.",
  );
  const [newName, setNewName] = useState("");
  const [comment, setComment] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(() => {
    seedDemoTeamIfEmpty();
    seedProjectsIfEmpty();
    setProjects(loadAtlasProjects());
    setMembers(loadTeamMembers());
  }, []);

  useEffect(() => {
    refresh();
    const list = loadAtlasProjects();
    setSelectedId(list[0]?.id ?? "");
  }, [refresh]);

  const selected = projects.find((p) => p.id === selectedId) ?? projects[0];
  const workload = useMemo(() => workloadByMember(), [projects]);

  function onCreateProject(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const p = createAtlasProject({ name: newName });
    refresh();
    setSelectedId(p.id);
    setNewName("");
    setNote(`Created project “${p.name}”.`);
  }

  function onGeneratePlan(e: FormEvent) {
    e.preventDefault();
    const p = generateProjectPlanFromPrompt(planPrompt);
    refresh();
    setSelectedId(p.id);
    setMode("projects");
    setNote(`Atlas generated “${p.name}” with ${p.tasks.length} tasks across your teams.`);
  }

  function onAddComment(e: FormEvent) {
    e.preventDefault();
    if (!selected || !comment.trim()) return;
    addProjectComment(selected.id, comment.trim());
    refresh();
    setComment("");
    setNote("Comment added to project history.");
  }

  function setTaskStatus(taskId: string, status: ProjectTaskStatus) {
    if (!selected) return;
    const tasks = selected.tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    updateAtlasProject(selected.id, { tasks });
    refresh();
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Projects</span>
          <strong>{projects.length}</strong>
          <small>Active portfolio</small>
        </div>
        <div className="stat">
          <span>At risk</span>
          <strong>{projects.filter((p) => assessProjectRisks(p).length > 0).length}</strong>
          <small>AI deadline warnings</small>
        </div>
        <div className="stat">
          <span>Open tasks</span>
          <strong>{projects.reduce((n, p) => n + p.tasks.filter((t) => t.status !== "completed").length, 0)}</strong>
          <small>Across projects</small>
        </div>
        <div className="stat">
          <span>Team load</span>
          <strong>{Object.keys(workload).length}</strong>
          <small>Members with work</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist">
        {[
          { id: "projects" as Mode, label: "Projects" },
          { id: "workload" as Mode, label: "Workload" },
          { id: "plan" as Mode, label: "AI plan" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={mode === tab.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      {mode === "plan" ? (
        <section className="panel">
          <h2>AI project plan</h2>
          <p className="panel-lead">Describe the goal — Atlas divides work, deadlines, and milestones across teams.</p>
          <form className="command-form" onSubmit={onGeneratePlan}>
            <input value={planPrompt} onChange={(e) => setPlanPrompt(e.target.value)} />
            <button className="btn btn-dark" type="submit">Generate plan</button>
          </form>
        </section>
      ) : null}

      {mode === "workload" ? (
        <section className="panel">
          <h2>Team workload</h2>
          <div className="list">
            {members.map((m) => {
              const w = workload[m.id];
              return (
                <div className="list-row" key={m.id}>
                  <div>
                    <strong>{m.name}</strong>
                    <small className="muted-line">{m.role}</small>
                  </div>
                  <span>{w?.open ?? 0} open · {w?.projects?.join(", ") || "No projects"}</span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {mode === "projects" ? (
        <div className="split">
          <section className="panel">
            <h2>Projects & folders</h2>
            <form className="field-row" onSubmit={onCreateProject}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New project name" />
              <button className="btn btn-dark" type="submit">Add project</button>
            </form>
            <div className="list" style={{ marginTop: "0.75rem" }}>
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={selected?.id === project.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setSelectedId(project.id)}
                >
                  <span className="badge">{project.progress}%</span>
                  <div>
                    <p><strong>{project.name}</strong></p>
                    <small className="muted-line">Due {project.dueDate || "—"} · {project.status}</small>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selected ? (
            <section className="panel">
              <h2>{selected.name}</h2>
              <p className="panel-lead">{selected.description || "No description yet."}</p>
              {assessProjectRisks(selected).length ? (
                <div className="memory-card">
                  <div className="label">Deadline risk</div>
                  <ul className="plain-list">
                    {assessProjectRisks(selected).map((w) => <li key={w}>{w}</li>)}
                  </ul>
                </div>
              ) : null}
              {aiSuggestionsForProject(selected).map((s) => (
                <p key={s} className="muted-line">💡 {s}</p>
              ))}

              <h3>Milestones</h3>
              <ul className="plain-list">
                {selected.milestones.map((m) => (
                  <li key={m.id}>{m.title} · {m.dueDate}{m.completed ? " ✓" : ""}</li>
                ))}
              </ul>

              <h3>Tasks</h3>
              <div className="list">
                {selected.tasks.map((task) => (
                  <div className="list-row" key={task.id}>
                    <div>
                      <strong>{task.title}</strong>
                      <small className="muted-line">{STATUS_LABELS[task.status]} · {task.priority} · due {task.dueDate || "—"}</small>
                    </div>
                    <select value={task.status} onChange={(e) => setTaskStatus(task.id, e.target.value as ProjectTaskStatus)}>
                      {Object.entries(STATUS_LABELS).map(([id, label]) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <h3>Activity</h3>
              <ul className="plain-list">
                {selected.activity.slice(0, 6).map((a) => (
                  <li key={a.id}><small>{a.text}</small></li>
                ))}
              </ul>

              <form className="command-form" onSubmit={onAddComment}>
                <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add project comment…" />
                <button className="btn btn-outline" type="submit">Comment</button>
              </form>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
