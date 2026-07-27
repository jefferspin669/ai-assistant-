"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { missionControl } from "@/lib/atlas-platform";

type Mode = "bridge" | "lanes" | "priorities" | "automate";

const modes: { id: Mode; label: string }[] = [
  { id: "bridge", label: "Command bridge" },
  { id: "lanes", label: "Six lanes" },
  { id: "priorities", label: "Highest impact" },
  { id: "automate", label: "Execute" },
];

export function MissionControlStudio() {
  const { callsign, ceo, status, intelligenceScore, partnerLine, lanes, priorities, automations } =
    missionControl;

  const [mode, setMode] = useState<Mode>("bridge");
  const [laneId, setLaneId] = useState<string>(lanes[0].id);
  const [visibleLanes, setVisibleLanes] = useState(0);
  const [booting, setBooting] = useState(true);
  const [autoState, setAutoState] = useState<Record<string, "idle" | "running" | "done">>({});
  const [note, setNote] = useState<string | null>(null);

  const activeLane = useMemo(
    () => lanes.find((lane) => lane.id === laneId) ?? lanes[0],
    [laneId, lanes],
  );

  useEffect(() => {
    setVisibleLanes(0);
    setBooting(true);
    const timers: number[] = [];
    lanes.forEach((_, index) => {
      timers.push(
        window.setTimeout(() => {
          setVisibleLanes(index + 1);
          if (index === lanes.length - 1) setBooting(false);
        }, 220 * (index + 1)),
      );
    });
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [lanes]);

  function runAutomation(id: string, label: string, needsConfirm: boolean) {
    if (needsConfirm) {
      setNote(`Needs your confirm: ${label}`);
      setAutoState((prev) => ({ ...prev, [id]: "idle" }));
      return;
    }
    setAutoState((prev) => ({ ...prev, [id]: "running" }));
    setNote(`Running: ${label}`);
    window.setTimeout(() => {
      setAutoState((prev) => ({ ...prev, [id]: "done" }));
      setNote(`Done — ${label}`);
    }, 700);
  }

  function runAllSafe() {
    const ready = automations.filter((item) => item.status === "ready");
    ready.forEach((item, index) => {
      window.setTimeout(() => runAutomation(item.id, item.label, false), 180 * index);
    });
  }

  return (
    <div className="training-studio mission-control">
      <section className="panel bridge-banner">
        <div className="bridge-banner-copy">
          <p className="muted-line">Mission Control · {callsign}</p>
          <h2>Good to have you on the bridge, {ceo}.</h2>
          <p className="panel-lead">{partnerLine}</p>
        </div>
        <div className="bridge-status">
          <div className="bridge-orb" aria-hidden />
          <div>
            <strong>{status}</strong>
            <span className="muted-line">Intelligence Score {intelligenceScore}</span>
            <span className="muted-line">{booting ? "Syncing lanes…" : "Partner online"}</span>
          </div>
        </div>
      </section>

      <div className="stat-grid metrics-dense">
        <div className="stat pulse-stat">
          <span>Overnight</span>
          <strong>94</strong>
          <small>Tasks already done</small>
        </div>
        <div className="stat pulse-stat">
          <span>Live now</span>
          <strong>12</strong>
          <small>Jobs in motion</small>
        </div>
        <div className="stat pulse-stat">
          <span>Decisions</span>
          <strong>3</strong>
          <small>Need your attention</small>
        </div>
        <div className="stat pulse-stat">
          <span>Safe autos</span>
          <strong>6</strong>
          <small>Inside standing rules</small>
        </div>
      </div>

      <div className="training-tabs" role="tablist" aria-label="Mission Control modes">
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

      {note ? <p className="mission-note">{note}</p> : null}

      {mode === "bridge" ? (
        <div className="bridge-grid">
          {lanes.slice(0, visibleLanes).map((lane) => (
            <button
              key={lane.id}
              type="button"
              className="bridge-lane"
              onClick={() => {
                setLaneId(lane.id);
                setMode("lanes");
              }}
            >
              <div className="bridge-lane-head">
                <strong>{lane.label}</strong>
                <span className="badge ok">Live</span>
              </div>
              <p>{lane.headline}</p>
              <span className="muted-line">{lane.summary}</span>
            </button>
          ))}
          {booting ? (
            <div className="bridge-lane bridge-lane-loading">
              <strong>Atlas is assembling the board…</strong>
              <span className="muted-line">Overnight · Now · Next · Decisions · Automate · Opportunities</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "lanes" ? (
        <div className="split">
          <section className="panel">
            <h2>Six awareness lanes</h2>
            <p className="panel-lead">
              Atlas continuously gathers, analyzes, and surfaces what matters — so you arrive already briefed.
            </p>
            <div className="list">
              {lanes.map((lane) => (
                <button
                  key={lane.id}
                  type="button"
                  className={laneId === lane.id ? "compliance-row active" : "compliance-row"}
                  onClick={() => setLaneId(lane.id)}
                >
                  <span className="badge ok">{lane.label}</span>
                  <p>
                    <strong>{lane.headline}</strong>
                    <span className="muted-line">{lane.summary}</span>
                  </p>
                </button>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>{activeLane.headline}</h2>
            <p className="muted-line">{activeLane.summary}</p>
            <div className="list" style={{ marginTop: "1rem" }}>
              {activeLane.items.map((item) => (
                <div className="list-row" key={item.time + item.text}>
                  <span className="time">{item.time}</span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
            {activeLane.id === "decisions" ? (
              <div className="train-actions">
                <Link className="btn btn-dark" href="/app/decisions">
                  Open Decision Engine
                </Link>
                <Link className="btn btn-ghost" href="/app/board">
                  Ask Board Advisor
                </Link>
              </div>
            ) : null}
            {activeLane.id === "automate" ? (
              <div className="train-actions">
                <button type="button" className="btn btn-dark" onClick={() => setMode("automate")}>
                  Review safe actions
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {mode === "priorities" ? (
        <section className="panel">
          <h2>Highest-impact actions</h2>
          <p className="panel-lead">
            Atlas recommends the few moves that matter most — then helps you execute.
          </p>
          <div className="list" style={{ marginTop: "1rem" }}>
            {priorities.map((item) => (
              <div className="list-row mission-priority" key={item.id}>
                <span className="badge">{item.rank}</span>
                <p>
                  <strong>{item.title}</strong>
                  <span className="muted-line">
                    {item.impact} · {item.why}
                  </span>
                </p>
                <Link className="btn btn-ghost" href={item.href}>
                  Open
                </Link>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {mode === "automate" ? (
        <div className="split">
          <section className="panel">
            <h2>Execute with Atlas</h2>
            <p className="panel-lead">
              Safe automations run inside standing rules. Anything outside waits for your confirm.
            </p>
            <div className="train-actions">
              <button type="button" className="btn btn-dark" onClick={runAllSafe}>
                Run all safe actions
              </button>
            </div>
            <div className="list" style={{ marginTop: "1rem" }}>
              {automations.map((item) => {
                const state = autoState[item.id] ?? "idle";
                const needsConfirm = item.status === "needs-confirm";
                return (
                  <div className="list-row" key={item.id}>
                    <span className={`badge ${needsConfirm ? "warn" : state === "done" ? "ok" : ""}`}>
                      {state === "done" ? "Done" : needsConfirm ? "Confirm" : "Safe"}
                    </span>
                    <p>{item.label}</p>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={state === "running" || state === "done"}
                      onClick={() => runAutomation(item.id, item.label, needsConfirm)}
                    >
                      {state === "running" ? "Running…" : state === "done" ? "Done" : needsConfirm ? "Review" : "Run"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="panel">
            <h2>Executive partner</h2>
            <div className="pack-grid dense">
              <div className="domain-card">
                <strong>Gather</strong>
                <span>Phones, routes, cash, reviews, inventory, and team signals — continuously.</span>
              </div>
              <div className="domain-card">
                <strong>Analyze</strong>
                <span>Score risk, forecast the day, and rank decisions by impact.</span>
              </div>
              <div className="domain-card">
                <strong>Recommend</strong>
                <span>Surface the highest-leverage moves — not a wall of noise.</span>
              </div>
              <div className="domain-card">
                <strong>Execute</strong>
                <span>Automate what’s safe; ask when judgment is required.</span>
              </div>
            </div>
            <div className="train-actions">
              <Link className="btn btn-dark" href="/app/ceo-memory">
                CEO Memory
              </Link>
              <Link className="btn btn-ghost" href="/app/executive-timeline">
                Executive Timeline
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
