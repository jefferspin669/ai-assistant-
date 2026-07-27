"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  businessCommandExamples,
  compileBusinessCommand,
} from "@/lib/atlas-platform";

export function CommandLanguageStudio() {
  const [input, setInput] = useState<string>(businessCommandExamples[0]);
  const [active, setActive] = useState(() => compileBusinessCommand(businessCommandExamples[0]));
  const [compiling, setCompiling] = useState(false);
  const [activated, setActivated] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState<string | null>(null);

  const steps = useMemo(
    () => [
      { label: "Trigger", value: active.trigger },
      { label: "Condition", value: active.condition },
      ...active.actions.map((action, index) => ({
        label: `Action ${index + 1}`,
        value: action,
      })),
    ],
    [active],
  );

  function compile(command: string) {
    setCompiling(true);
    setNote(null);
    window.setTimeout(() => {
      const result = compileBusinessCommand(command);
      setActive(result);
      setCompiling(false);
    }, 450);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    compile(input);
  }

  function activate() {
    setActivated((prev) => ({ ...prev, [active.id]: true }));
    setNote(`Automation “${active.title}” is live. Atlas will enforce the safeguards.`);
  }

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Input</span>
          <strong>Plain English</strong>
          <small>No coding required</small>
        </div>
        <div className="stat">
          <span>Compiled steps</span>
          <strong>{steps.length}</strong>
          <small>Trigger · condition · actions</small>
        </div>
        <div className="stat">
          <span>Safeguards</span>
          <strong>{active.safeguards.length}</strong>
          <small>Built into the rule</small>
        </div>
        <div className="stat">
          <span>Status</span>
          <strong>{activated[active.id] ? "Live" : active.status.split(" ")[0]}</strong>
          <small>{activated[active.id] ? "Running" : "Review then activate"}</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Business Command Language</h2>
          <p className="panel-lead">
            Type what you want in plain English. Atlas converts it into an automation with trigger,
            conditions, actions, and safeguards.
          </p>
          <form className="train-form" onSubmit={onSubmit}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              aria-label="Business command"
              placeholder="Increase Facebook ads by 20% if…"
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid var(--line)",
                padding: "0.75rem 0.9rem",
                font: "inherit",
                resize: "vertical",
              }}
            />
            <button className="btn btn-dark" type="submit" disabled={compiling}>
              {compiling ? "Compiling…" : "Compile automation"}
            </button>
          </form>

          <div className="list" style={{ marginTop: "1rem" }}>
            {businessCommandExamples.map((example) => (
              <button
                key={example}
                type="button"
                className={input === example ? "compliance-row active" : "compliance-row"}
                onClick={() => {
                  setInput(example);
                  compile(example);
                }}
              >
                <span className="badge">Example</span>
                <p>{example}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{active.title}</h2>
          <p className="panel-lead">{active.plainEnglish}</p>

          <div className="chat-mock" style={{ marginTop: "0.85rem" }}>
            <div className="bubble bubble-user">{active.plainEnglish}</div>
            <div className="bubble bubble-ai">
              Compiled into {steps.length} steps with {active.safeguards.length} safeguards.{" "}
              {active.status}.
            </div>
          </div>

          <h3 style={{ marginTop: "1rem" }}>Automation graph</h3>
          <div className="list">
            {compiling ? (
              <div className="list-row">
                <span className="badge warn">…</span>
                <p className="muted-line">Converting plain English into workflow steps…</p>
              </div>
            ) : (
              steps.map((step) => (
                <div className="list-row" key={`${step.label}-${step.value}`}>
                  <span className="badge">{step.label}</span>
                  <p>{step.value}</p>
                </div>
              ))
            )}
          </div>

          {!compiling ? (
            <>
              <h3 style={{ marginTop: "1rem" }}>Safeguards</h3>
              <div className="list">
                {active.safeguards.map((item) => (
                  <div className="list-row" key={item}>
                    <span className="badge ok">Guard</span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
              <div className="cta-row" style={{ marginTop: "1rem" }}>
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={activate}
                  disabled={!!activated[active.id]}
                >
                  {activated[active.id] ? "Activated" : "Activate automation"}
                </button>
                <button className="btn btn-outline" type="button">
                  Open in Workflow Builder
                </button>
              </div>
              {note ? (
                <p className="muted-line" style={{ marginTop: "0.85rem" }}>
                  {note}
                </p>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
