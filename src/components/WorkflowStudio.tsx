"use client";

import { useMemo, useState } from "react";
import {
  workflowPalette,
  workflowTemplates,
} from "@/lib/atlas-platform";

type Step = { id: string; kind: string; label: string };

export function WorkflowStudio() {
  const [templateId, setTemplateId] = useState<string>(workflowTemplates[0].id);
  const [steps, setSteps] = useState<Step[]>([...workflowTemplates[0].steps]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  const template = useMemo(
    () => workflowTemplates.find((item) => item.id === templateId) ?? workflowTemplates[0],
    [templateId],
  );

  function loadTemplate(id: string) {
    const next = workflowTemplates.find((item) => item.id === id) ?? workflowTemplates[0];
    setTemplateId(next.id);
    setSteps([...next.steps]);
    setNote(`Loaded “${next.name}”. Drag steps to reorder — no coding required.`);
  }

  function addStep(kind: string, label: string) {
    setSteps((prev) => [
      ...prev,
      { id: `${kind}-${label}-${prev.length}-${Date.now()}`, kind, label },
    ]);
    setNote(`Added ${kind.toLowerCase()}: ${label}.`);
  }

  function onDragStart(index: number) {
    setDragIndex(index);
  }

  function onDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return;
    setSteps((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(null);
    setNote("Steps reordered.");
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((step) => step.id !== id));
    setNote("Step removed from the automation.");
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
          <span>Templates</span>
          <strong>{workflowTemplates.length}</strong>
          <small>Ready to install</small>
        </div>
        <div className="stat">
          <span>Status</span>
          <strong>{enabled ? "On" : "Off"}</strong>
          <small>{enabled ? "Live automation" : "Paused"}</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Templates</h2>
          <div className="list">
            {workflowTemplates.map((item) => (
              <button
                key={item.id}
                type="button"
                className={templateId === item.id ? "compliance-row active" : "compliance-row"}
                onClick={() => loadTemplate(item.id)}
              >
                <span className="badge ok">Load</span>
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
          <div className="train-head">
            <div>
              <h2>{template.name}</h2>
              <p className="panel-lead">
                Trigger → actions. Example: If a customer misses a call → send a text → create a
                lead → schedule a follow-up.
              </p>
            </div>
            <button
              className={`btn ${enabled ? "btn-outline" : "btn-dark"}`}
              type="button"
              onClick={() => {
                setEnabled((value) => !value);
                setNote(enabled ? "Workflow paused." : "Workflow enabled.");
              }}
            >
              {enabled ? "Pause" : "Enable"}
            </button>
          </div>

          <div className="workflow-canvas">
            {steps.map((step, index) => (
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
            ))}
          </div>

          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      </div>
    </div>
  );
}
