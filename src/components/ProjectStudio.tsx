"use client";

import { useMemo, useState } from "react";
import { projects } from "@/lib/atlas-platform";

type Mode = "board" | "timeline" | "risks" | "updates";

const modes: { id: Mode; label: string }[] = [
  { id: "board", label: "Projects" },
  { id: "timeline", label: "Deadlines & team" },
  { id: "risks", label: "Risks & deps" },
  { id: "updates", label: "Auto updates" },
];

export function ProjectStudio() {
  const [mode, setMode] = useState<Mode>("board");
  const [selectedId, setSelectedId] = useState<string>(projects[0].id);
  const [notified, setNotified] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);

  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? projects[0],
    [selectedId],
  );

  function notifyTeam(projectId: string, name: string) {
    setNotified((prev) => ({ ...prev, [projectId]: true }));
    setNote(`Atlas updated everyone on “${name}” — team, deadline owners, and risk watchers.`);
    setMode("updates");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Projects</span>
          <strong>{projects.length}</strong>
          <small>Active</small>
        </div>
        <div className="stat">
          <span>Avg progress</span>
          <strong>
            {Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)}%
          </strong>
          <small>Across portfolio</small>
        </div>
        <div className="stat">
          <span>At risk</span>
          <strong>{projects.filter((project) => project.risk !== "Low").length}</strong>
          <small>Need attention</small>
        </div>
        <div className="stat">
          <span>Auto updates</span>
          <strong>{Object.keys(notified).length}</strong>
          <small>Sent this session</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Project manager modes">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={mode === item.id}
            className={mode === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "board" ? (
        <div className="split">
          <section className="panel">
            <h2>Projects</h2>
            <p className="panel-lead">
              Atlas knows projects, deadlines, teams, budgets, progress, risks, and dependencies.
            </p>
            <div className="list">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={selectedId === project.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setSelectedId(project.id)}
                >
                  <span className={`badge${project.risk === "Low" ? " ok" : " warn"}`}>
                    {project.progress}%
                  </span>
                  <div>
                    <p>
                      <strong>{project.name}</strong>
                    </p>
                    <small className="muted-line">
                      Due {project.deadline} · {project.budget}
                    </small>
                    <div className="train-track" aria-hidden>
                      <div className="train-fill" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>{selected.name}</h2>
            <div className="list">
              <div className="list-row">
                <span className="badge ok">{selected.progress}%</span>
                <p>
                  Progress · spent {selected.spent} of {selected.budget}
                </p>
              </div>
              <div className="list-row">
                <span className={`badge${selected.risk === "Low" ? " ok" : " warn"}`}>Risk</span>
                <p>{selected.risk}</p>
              </div>
              <div className="list-row">
                <span className="badge">Next</span>
                <p>{selected.next}</p>
              </div>
            </div>
            <div className="train-actions">
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => notifyTeam(selected.id, selected.name)}
              >
                {notified[selected.id] ? "Update sent" : "Keep everyone updated"}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => setMode("timeline")}>
                View team & deadline
              </button>
            </div>
            {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
          </section>
        </div>
      ) : null}

      {mode === "timeline" ? (
        <section className="panel">
          <h2>Deadlines & teams · {selected.name}</h2>
          <div className="split" style={{ marginTop: "0.35rem" }}>
            <div className="list">
              <div className="list-row">
                <span className="badge warn">{selected.deadline}</span>
                <p>Project deadline</p>
              </div>
              <div className="list-row">
                <span className="badge">Budget</span>
                <p>
                  {selected.spent} spent · {selected.budget}
                </p>
              </div>
            </div>
            <div className="list">
              {selected.team.map((member) => (
                <div className="list-row" key={member}>
                  <span className="badge ok">Team</span>
                  <p>{member}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {mode === "risks" ? (
        <section className="panel">
          <h2>Risks & dependencies</h2>
          <div className="list">
            {projects.map((project) => (
              <div className="list-row" key={project.id}>
                <span className={`badge${project.risk === "Low" ? " ok" : " warn"}`}>
                  {project.risk}
                </span>
                <div>
                  <p>
                    <strong>{project.name}</strong>
                  </p>
                  <small className="muted-line">
                    Depends on: {project.dependencies.join(" · ")}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "updates" ? (
        <section className="panel">
          <h2>Automatic updates</h2>
          <p className="panel-lead">Atlas keeps everyone updated when progress, risk, or deadlines move.</p>
          <div className="list">
            {selected.updates.map((update) => (
              <div className="list-row" key={update}>
                <span className="badge ok">Sent</span>
                <p>{update}</p>
              </div>
            ))}
            {notified[selected.id] ? (
              <div className="list-row">
                <span className="badge warn">Just now</span>
                <p>
                  Atlas updated everyone on “{selected.name}” — {selected.team.join(", ")}.
                </p>
              </div>
            ) : null}
          </div>
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
