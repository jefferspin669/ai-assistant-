"use client";

import { useState } from "react";
import { computerCapabilities, computerTasks } from "@/lib/atlas-platform";

export function ComputerControlStudio() {
  const [selectedId, setSelectedId] = useState(computerTasks[0].id);
  const [permission, setPermission] = useState(false);
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [note, setNote] = useState<string | null>(null);

  const selected = computerTasks.find((task) => task.id === selectedId) ?? computerTasks[0];

  function runTask() {
    if (!permission) {
      setNote("Grant desktop control permission first — Atlas never acts without consent.");
      return;
    }
    setRunning(true);
    setStepIndex(0);
    setNote(`Running “${selected.title}”…`);
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      if (i >= selected.steps.length) {
        window.clearInterval(timer);
        setRunning(false);
        setStepIndex(selected.steps.length - 1);
        setNote(`Finished “${selected.title}”. Log saved to Security Center.`);
        return;
      }
      setStepIndex(i);
    }, 700);
  }

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
          <span>Audit</span>
          <strong>On</strong>
          <small>Every click logged</small>
        </div>
      </div>

      <div className="train-actions" style={{ marginTop: 0 }}>
        <button
          className={`btn ${permission ? "btn-outline" : "btn-dark"}`}
          type="button"
          onClick={() => {
            setPermission((value) => !value);
            setNote(
              permission
                ? "Desktop control revoked."
                : "Permission granted. Atlas may open apps and fill forms on this device.",
            );
          }}
        >
          {permission ? "Revoke permission" : "Grant desktop control"}
        </button>
        <button className="btn btn-dark" type="button" disabled={running} onClick={runTask}>
          {running ? "Running…" : "Run selected task"}
        </button>
      </div>
      {note ? <p className="muted-line">{note}</p> : null}

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
                <span className={`badge${task.status === "Needs permission" ? " warn" : " ok"}`}>
                  {task.status}
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
