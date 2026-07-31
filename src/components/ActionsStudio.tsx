"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  actionDevices,
  actionExamples,
  parseAtlasAction,
  seedConversation,
  type ActionStep,
  type AtlasActionPlan,
  type ConversationTurn,
} from "@/lib/atlas-actions";

const STORAGE_KEY = "atlas-actions-thread";

function nowLabel() {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function deviceName(id: string) {
  return actionDevices.find((item) => item.id === id)?.name ?? id;
}

export function ActionsStudio() {
  const [deviceId, setDeviceId] = useState("web");
  const [input, setInput] = useState(actionExamples[0]);
  const [thread, setThread] = useState<ConversationTurn[]>(seedConversation);
  const [plan, setPlan] = useState<AtlasActionPlan | null>(null);
  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [running, setRunning] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const timers = useRef<number[]>([]);
  const threadEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ConversationTurn[];
      if (Array.isArray(parsed) && parsed.length) setThread(parsed);
    } catch {
      /* ignore bad cache */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(thread));
    } catch {
      /* ignore quota */
    }
    threadEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function pushTurn(turn: Omit<ConversationTurn, "id" | "when">) {
    setThread((prev) => [
      ...prev,
      {
        ...turn,
        id: `${Date.now()}-${prev.length}`,
        when: nowLabel(),
      },
    ]);
  }

  function compile(command: string) {
    const next = parseAtlasAction(command);
    setPlan(next);
    setSteps(next.steps.map((step) => ({ ...step, status: "pending" })));
    setConfirmed(false);
    setRunning(false);
    setNote(null);
    pushTurn({ role: "user", text: command, device: deviceId });
    pushTurn({
      role: "atlas",
      text: `Got it — I’ll ${next.summary.replace(/\.$/, "")}. Here’s the plan across ${next.steps.length} systems.`,
      device: deviceId,
      planId: next.id,
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || running) return;
    compile(trimmed);
  }

  function runPlan() {
    if (!plan || running) return;
    setConfirmed(true);
    setRunning(true);
    setNote("Running Atlas Action… synced to every device.");
    pushTurn({
      role: "atlas",
      text: `Running now from ${deviceName(deviceId)}. You can keep talking on phone, watch, or car — same thread.`,
      device: deviceId,
      planId: plan.id,
    });

    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];

    plan.steps.forEach((_, index) => {
      const startId = window.setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) =>
            i === index ? { ...step, status: "running" } : step,
          ),
        );
      }, index * 700);
      const doneId = window.setTimeout(() => {
        setSteps((prev) =>
          prev.map((step, i) => (i === index ? { ...step, status: "done" } : step)),
        );
        if (index === plan.steps.length - 1) {
          setRunning(false);
          setNote(plan.doneSummary);
          pushTurn({
            role: "atlas",
            text: plan.doneSummary,
            device: deviceId,
            planId: plan.id,
          });
        }
      }, index * 700 + 550);
      timers.current.push(startId, doneId);
    });
  }

  function switchDevice(nextId: string) {
    setDeviceId(nextId);
    const name = deviceName(nextId);
    setNote(`Continuing on ${name}. Same conversation — nothing to re-explain.`);
    pushTurn({
      role: "atlas",
      text: `You’re on ${name} now. I still have the full thread and any Actions in progress.`,
      device: nextId,
    });
  }

  const doneCount = steps.filter((step) => step.status === "done").length;
  const activeDevice = actionDevices.find((item) => item.id === deviceId) ?? actionDevices[2];

  return (
    <div className="training-studio actions-studio">
      <section className="panel actions-hero">
        <p className="briefing-kicker">Atlas Actions · centerpiece</p>
        <h2>Don’t ask how. Tell Atlas what to do.</h2>
        <p>
          Instead of “How do I create an invoice?” say the whole outcome — create it, email it,
          remind them, update the books. One conversation, every device.
        </p>
      </section>

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Mode</span>
          <strong>Do it</strong>
          <small>Not tutorials</small>
        </div>
        <div className="stat">
          <span>This action</span>
          <strong>{plan ? plan.steps.length : "—"}</strong>
          <small>{plan ? "Steps planned" : "Waiting for command"}</small>
        </div>
        <div className="stat">
          <span>Progress</span>
          <strong>
            {plan ? `${doneCount}/${plan.steps.length}` : "0"}
          </strong>
          <small>{running ? "Running" : confirmed && plan ? "Complete" : "Ready"}</small>
        </div>
        <div className="stat">
          <span>Device</span>
          <strong>{activeDevice.name}</strong>
          <small>Thread continues</small>
        </div>
      </div>

      <div className="actions-device-row" role="group" aria-label="Continue on device">
        {actionDevices.map((device) => (
          <button
            key={device.id}
            type="button"
            className={deviceId === device.id ? "actions-device active" : "actions-device"}
            onClick={() => switchDevice(device.id)}
          >
            <strong>{device.name}</strong>
            <span>
              {deviceId === device.id ? "This device" : device.status} · {device.detail}
            </span>
          </button>
        ))}
      </div>
      {note ? <p className="muted-line">{note}</p> : null}

      <div className="split actions-split">
        <section className="panel">
          <div className="command-head">
            <div>
              <h2>Conversation</h2>
              <p className="panel-lead">
                Seamless across phone, app, desktop, watch, car, speakers, and web.
              </p>
            </div>
            <span className="badge ok">{deviceName(deviceId)}</span>
          </div>

          <div className="actions-thread" aria-live="polite">
            {thread.map((turn) => (
              <div
                key={turn.id}
                className={turn.role === "user" ? "bubble bubble-user" : "bubble bubble-ai"}
              >
                <div className="agent-tag">
                  {turn.role === "user" ? "You" : "Atlas"} · {deviceName(turn.device)} · {turn.when}
                </div>
                {turn.text}
              </div>
            ))}
            <div ref={threadEnd} />
          </div>

          <div className="suggestion-row">
            {actionExamples.map((example) => (
              <button
                key={example}
                type="button"
                className="suggestion"
                onClick={() => {
                  setInput(example);
                  compile(example);
                }}
              >
                {example.length > 72 ? `${example.slice(0, 69)}…` : example}
              </button>
            ))}
          </div>

          <form className="command-form" onSubmit={onSubmit}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Atlas, create an invoice for Acme Corp for $1,250…'
              aria-label="Atlas Action command"
              disabled={running}
            />
            <button className="btn btn-dark" type="submit" disabled={running}>
              Plan action
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>{plan ? plan.title : "Action plan"}</h2>
          {plan ? (
            <>
              <p className="panel-lead">{plan.summary}</p>
              <div className="memory-card">
                <div className="label">Needs your OK</div>
                <p>{plan.confirmPrompt}</p>
              </div>
              <div className="workflow-canvas" style={{ marginTop: "1rem" }}>
                {steps.map((item, index) => (
                  <div className="workflow-canvas-row" key={item.id}>
                    <div className="workflow-step">
                      <span
                        className={`badge${
                          item.status === "done"
                            ? " ok"
                            : item.status === "running"
                              ? " warn"
                              : ""
                        }`}
                      >
                        {item.status === "done"
                          ? "Done"
                          : item.status === "running"
                            ? "Running"
                            : `Step ${index + 1}`}
                      </span>
                      <div>
                        <strong>{item.label}</strong>
                        <span className="muted-line">
                          {item.system} · {item.detail}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="train-actions">
                <button
                  className="btn btn-dark"
                  type="button"
                  disabled={running || (confirmed && doneCount === steps.length)}
                  onClick={runPlan}
                >
                  {running
                    ? "Running…"
                    : confirmed && doneCount === steps.length
                      ? "Action complete"
                      : "Yes, run Atlas Action"}
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  disabled={running}
                  onClick={() => {
                    setPlan(null);
                    setSteps([]);
                    setConfirmed(false);
                    setNote("Action cleared. Tell me the next outcome.");
                  }}
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <div className="memory-card">
              <div className="label">Waiting</div>
              <p>
                Say the full outcome in one sentence. Atlas will plan the systems, ask once, then
                execute — and keep the thread alive on every device.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
