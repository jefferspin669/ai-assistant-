"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { computerCapabilities, computerTasks, securityAuditLog } from "@/lib/atlas-platform";
import {
  appendComputerAudit,
  loadComputerAudit,
  type ComputerAuditEntry,
} from "@/lib/ops-workspace";

export function ComputerControlStudio({ auditSignal = 0 }: { auditSignal?: number }) {
  const [selectedId, setSelectedId] = useState(computerTasks[0].id);
  const [permission, setPermission] = useState(false);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(computerTasks.map((task) => [task.id, task.status])),
  );
  const [showAudit, setShowAudit] = useState(false);
  const [audit, setAudit] = useState<ComputerAuditEntry[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const selected = computerTasks.find((task) => task.id === selectedId) ?? computerTasks[0];

  useEffect(() => {
    setAudit(loadComputerAudit());
  }, []);

  useEffect(() => {
    if (auditSignal <= 0) return;
    setShowAudit(true);
    setAudit(loadComputerAudit());
    setNote("Reviewing computer-control audit log.");
  }, [auditSignal]);

  function refreshAudit() {
    setAudit(loadComputerAudit());
  }

  function runTask() {
    if (!permission) {
      setNote("Grant desktop control permission first — Atlas never acts without consent.");
      return;
    }
    setRunning(true);
    setStepIndex(0);
    setStatuses((prev) => ({ ...prev, [selected.id]: "Running" }));
    setNote(`Running “${selected.title}”…`);
    appendComputerAudit(`Started task: ${selected.title}`);
    refreshAudit();
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      if (i >= selected.steps.length) {
        window.clearInterval(timer);
        setRunning(false);
        setStepIndex(selected.steps.length - 1);
        setStatuses((prev) => ({ ...prev, [selected.id]: "Completed" }));
        appendComputerAudit(`Finished task: ${selected.title}`);
        refreshAudit();
        setNote(`Finished “${selected.title}”. Log saved to audit.`);
        return;
      }
      setStepIndex(i);
      appendComputerAudit(`Step ${i + 1}: ${selected.steps[i]}`);
      refreshAudit();
    }, 700);
  }

  const combinedAudit = [
    ...audit,
    ...securityAuditLog.map((entry, index) => ({
      id: `sec-${index}`,
      when: entry.when,
      actor: entry.actor,
      action: entry.action,
      createdAt: "",
    })),
  ];

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Permission</span>
          <strong>{permission ? "Granted" : "Off"}</strong>
          <small>Owner controlled</small>
        </div>
        <div className="stat">
          <span>Capabilities</span>
          <strong>{computerCapabilities.length}</strong>
          <small>Desktop actions</small>
        </div>
        <div className="stat">
          <span>Queued tasks</span>
          <strong>{computerTasks.length}</strong>
          <small>Ready to run</small>
        </div>
        <div className="stat">
          <span>Audit entries</span>
          <strong>{combinedAudit.length}</strong>
          <small>Every click logged</small>
        </div>
      </div>

      <div className="train-actions" style={{ marginTop: 0 }}>
        <button
          className={`btn ${permission ? "btn-outline" : "btn-dark"}`}
          type="button"
          onClick={() => {
            setPermission((value) => !value);
            const next = !permission;
            appendComputerAudit(
              next ? "Desktop control permission granted" : "Desktop control permission revoked",
              "Owner",
            );
            refreshAudit();
            setNote(
              next
                ? "Permission granted. Atlas may open apps and fill forms on this device."
                : "Desktop control revoked.",
            );
          }}
        >
          {permission ? "Revoke permission" : "Grant desktop control"}
        </button>
        <button className="btn btn-dark" type="button" disabled={running} onClick={runTask}>
          {running ? "Running…" : "Run selected task"}
        </button>
        <button
          className="btn btn-outline"
          type="button"
          onClick={() => {
            setShowAudit(true);
            refreshAudit();
          }}
        >
          Review audit log
        </button>
      </div>
      {note ? <p className="muted-line">{note}</p> : null}

      {showAudit ? (
        <section className="panel">
          <div className="train-head">
            <div>
              <h2>Computer control audit log</h2>
              <p className="panel-lead">Every permission change and desktop step is recorded here.</p>
            </div>
            <Link className="btn btn-outline" href="/app/security">
              Open Security Center
            </Link>
          </div>
          <div className="list">
            {combinedAudit.length === 0 ? (
              <p className="muted-line">No audit entries yet. Run a task to create one.</p>
            ) : (
              combinedAudit.map((entry) => (
                <div className="list-row" key={entry.id}>
                  <span className="time">{entry.when}</span>
                  <p>
                    <strong>{entry.actor}</strong>
                    <span className="muted-line">{entry.action}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      <div className="split">
        <section className="panel">
          <h2>What Atlas can do</h2>
          <p className="panel-lead">With permission — open apps, fill forms, and finish busywork.</p>
          <div className="list">
            {computerCapabilities.map((item) => (
              <div className="list-row" key={item.label}>
                <span className="badge ok">Allowed</span>
                <p>
                  <strong>{item.label}</strong>
                  <span className="muted-line">{item.detail}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Control queue</h2>
          <div className="list">
            {computerTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className={selectedId === task.id ? "compliance-row active" : "compliance-row"}
                onClick={() => {
                  setSelectedId(task.id);
                  setStepIndex(-1);
                  setNote(null);
                }}
              >
                <span
                  className={`badge${
                    (statuses[task.id] || task.status) === "Needs permission"
                      ? " warn"
                      : (statuses[task.id] || task.status) === "Completed"
                        ? " ok"
                        : ""
                  }`}
                >
                  {statuses[task.id] || task.status}
                </span>
                <div>
                  <p>
                    <strong>{task.title}</strong>
                  </p>
                  <small className="muted-line">{task.steps.length} steps</small>
                </div>
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: "1rem" }}>Live steps · {selected.title}</h3>
          <div className="workflow-canvas">
            {selected.steps.map((step, index) => (
              <div className="workflow-canvas-row" key={step}>
                <div className="workflow-step">
                  <span className={`badge${index <= stepIndex ? " ok" : ""}`}>
                    {index <= stepIndex ? "Done" : `Step ${index + 1}`}
                  </span>
                  <strong>{step}</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
