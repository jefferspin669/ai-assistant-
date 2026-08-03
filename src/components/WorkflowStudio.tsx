"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { workflowPalette, workflowTemplates } from "@/lib/atlas-platform";
import {
  createEmptyWorkflow,
  loadWorkflows,
  saveWorkflows,
  type UserWorkflow,
  type WorkflowStep,
} from "@/lib/user-workspace";

export type WorkflowStudioHandle = {
  newWorkflow: () => void;
};

export const WorkflowStudio = forwardRef<WorkflowStudioHandle>(function WorkflowStudio(
  _props,
  ref,
) {
  const [workflows, setWorkflows] = useState<UserWorkflow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadWorkflows();
    setWorkflows(loaded);
    setSelectedId(loaded[0]?.id ?? null);
    setNameDraft(loaded[0]?.name ?? "");
    setReady(true);
  }, []);

  const selected = workflows.find((wf) => wf.id === selectedId) ?? null;
  const steps = selected?.steps ?? [];

  function persist(next: UserWorkflow[], selectId?: string | null) {
    setWorkflows(next);
    saveWorkflows(next);
    if (selectId !== undefined) {
      setSelectedId(selectId);
      const found = next.find((wf) => wf.id === selectId);
      setNameDraft(found?.name ?? "");
    }
  }

  function patchSelected(patch: Partial<UserWorkflow>) {
    if (!selected) return;
    const next = workflows.map((wf) => (wf.id === selected.id ? { ...wf, ...patch } : wf));
    persist(next);
  }

  function newWorkflow() {
    const wf = createEmptyWorkflow(`Workflow ${workflows.length + 1}`);
    const next = [wf, ...workflows];
    persist(next, wf.id);
    setNote("Blank automation created. Add steps from the palette — nothing is preloaded.");
  }

  useImperativeHandle(ref, () => ({ newWorkflow }));

  function addStep(kind: string, label: string) {
    if (!selected) {
      setNote("Create a workflow first (New workflow).");
      return;
    }
    const step: WorkflowStep = {
      id: `${kind}-${label}-${Date.now()}`,
      kind,
      label,
    };
    patchSelected({ steps: [...selected.steps, step] });
    setNote(`Added ${kind.toLowerCase()}: ${label}.`);
  }

  function onDragStart(index: number) {
    setDragIndex(index);
  }

  function onDrop(index: number) {
    if (!selected || dragIndex === null || dragIndex === index) return;
    const nextSteps = [...selected.steps];
    const [moved] = nextSteps.splice(dragIndex, 1);
    nextSteps.splice(index, 0, moved);
    patchSelected({ steps: nextSteps });
    setDragIndex(null);
    setNote("Steps reordered.");
  }

  function removeStep(id: string) {
    if (!selected) return;
    patchSelected({ steps: selected.steps.filter((step) => step.id !== id) });
    setNote("Step removed from the automation.");
  }

  function loadTemplate(id: string) {
    const template = workflowTemplates.find((item) => item.id === id);
    if (!template) return;
    const base = selected ?? createEmptyWorkflow(template.name);
    const wf: UserWorkflow = {
      ...base,
      name: template.name,
      blurb: template.blurb,
      steps: template.steps.map((step) => ({ ...step, id: `${step.id}-${Date.now()}` })),
      enabled: false,
    };
    if (selected) {
      persist(
        workflows.map((item) => (item.id === selected.id ? wf : item)),
        wf.id,
      );
    } else {
      persist([wf, ...workflows], wf.id);
    }
    setNameDraft(wf.name);
    setNote(`Loaded template “${template.name}” into the canvas. Edit freely.`);
  }

  function removeWorkflow(id: string) {
    const next = workflows.filter((wf) => wf.id !== id);
    persist(next, next[0]?.id ?? null);
    setNote("Workflow removed.");
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Builder</span>
          <strong>No-code</strong>
          <small>Drag & drop</small>
        </div>
        <div className="stat">
          <span>Steps</span>
          <strong>{steps.length}</strong>
          <small>In canvas</small>
        </div>
        <div className="stat">
          <span>Your workflows</span>
          <strong>{workflows.length}</strong>
          <small>Saved here</small>
        </div>
        <div className="stat">
          <span>Status</span>
          <strong>{selected?.enabled ? "On" : "Off"}</strong>
          <small>{selected?.enabled ? "Live automation" : "Paused / empty"}</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <div className="train-head">
            <div>
              <h2>Your automations</h2>
              <p className="panel-lead">Starts empty. Add workflows — they accumulate.</p>
            </div>
            <button className="btn btn-dark" type="button" onClick={newWorkflow}>
              New workflow
            </button>
          </div>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && workflows.length === 0 ? (
            <p className="muted-line">No workflows yet. Create one or load an optional template.</p>
          ) : (
            <div className="list">
              {workflows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selectedId === item.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => {
                    setSelectedId(item.id);
                    setNameDraft(item.name);
                  }}
                >
                  <span className={`badge${item.enabled ? " ok" : ""}`}>
                    {item.enabled ? "On" : "Off"}
                  </span>
                  <div>
                    <p>
                      <strong>{item.name}</strong>
                    </p>
                    <small className="muted-line">
                      {item.steps.length} step{item.steps.length === 1 ? "" : "s"}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: "1rem" }}>Optional templates</h3>
          <div className="list">
            {workflowTemplates.map((item) => (
              <button
                key={item.id}
                type="button"
                className="compliance-row"
                onClick={() => loadTemplate(item.id)}
              >
                <span className="badge">Load</span>
                <div>
                  <p>
                    <strong>{item.name}</strong>
                  </p>
                  <small className="muted-line">{item.blurb}</small>
                </div>
              </button>
            ))}
          </div>

          <h3 style={{ marginTop: "1rem" }}>Palette</h3>
          <div className="quality-filter-row">
            {workflowPalette.map((item) => (
              <button
                key={`${item.kind}-${item.label}`}
                type="button"
                className="training-tab"
                onClick={() => addStep(item.kind, item.label)}
              >
                + {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          {selected ? (
            <>
              <div className="train-head">
                <div>
                  <label>
                    Workflow name
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onBlur={() => patchSelected({ name: nameDraft.trim() || selected.name })}
                      style={{ display: "block", marginTop: "0.35rem", width: "100%" }}
                    />
                  </label>
                  <p className="panel-lead">
                    Trigger → actions. Add steps yourself — the canvas does not come pre-filled.
                  </p>
                </div>
                <div className="train-actions">
                  <button
                    className={`btn ${selected.enabled ? "btn-outline" : "btn-dark"}`}
                    type="button"
                    onClick={() => {
                      patchSelected({ enabled: !selected.enabled });
                      setNote(selected.enabled ? "Workflow paused." : "Workflow enabled.");
                    }}
                  >
                    {selected.enabled ? "Pause" : "Enable"}
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    onClick={() => removeWorkflow(selected.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="workflow-canvas">
                {steps.length === 0 ? (
                  <p className="muted-line">
                    Empty canvas. Use the palette to add a trigger and actions.
                  </p>
                ) : (
                  steps.map((step, index) => (
                    <div key={step.id} className="workflow-canvas-row">
                      <div
                        className="workflow-step draggable"
                        draggable
                        onDragStart={() => onDragStart(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDrop(index)}
                      >
                        <span>{step.kind}</span>
                        <strong>{step.label}</strong>
                        <small>Drag to reorder</small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => removeStep(step.id)}
                        aria-label={`Remove ${step.label}`}
                      >
                        Remove
                      </button>
                      {index < steps.length - 1 ? (
                        <div className="workflow-arrow canvas-arrow" aria-hidden>
                          ↓
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="muted-line">Create a new workflow to start building.</p>
          )}

          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      </div>
    </div>
  );
});
