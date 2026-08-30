"use client";

import Link from "@/components/SiteLink";
import { useEffect, useRef, useState } from "react";
import { useAtlasRuntime } from "@/components/AtlasRuntimeProvider";
import {
  AWAY_POLICY,
  AWAY_REPORT,
  AUTONOMY_LEVELS,
  levelDef,
  runtimeStatusLabel,
} from "@/lib/atlas-runtime";

export function AtlasStatus() {
  const { runtime, setPaused, leave, comeBack } = useAtlasRuntime();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const level = levelDef(runtime.level);
  const status = runtimeStatusLabel(runtime);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="atlas-status" ref={wrapRef}>
      <button
        type="button"
        className={`atlas-status-chip${runtime.paused ? " is-paused" : ""}${runtime.away ? " is-away" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="atlas-status-dot" aria-hidden="true" />
        Atlas · {status}
      </button>
      {open ? (
        <div className="atlas-status-panel" role="dialog" aria-label="Atlas status">
          <p className="atlas-status-kicker">Atlas status</p>
          <p>
            Autonomy: <strong>{level.name}</strong>
          </p>
          <ul className="atlas-status-stats">
            <li>Agents active: {runtime.agentsActive}</li>
            <li>Automations running: {runtime.automationsRunning}</li>
            <li>Tasks completed today: {runtime.tasksCompletedToday}</li>
            <li>Needs approval: {runtime.paused ? "Paused" : "3"}</li>
            <li>Issues: {runtime.paused ? "—" : "0"}</li>
          </ul>
          {runtime.away ? (
            <p className="muted-line">Spending limit ${AWAY_POLICY.spendLimit} · refunds ${AWAY_POLICY.refundLimit}</p>
          ) : null}
          <div className="cta-row">
            {runtime.away ? (
              <button type="button" className="btn btn-dark" onClick={() => { comeBack(); setOpen(false); }}>
                I&apos;m back
              </button>
            ) : (
              <button type="button" className="btn btn-outline" onClick={() => { leave(); setOpen(false); }}>
                I&apos;m leaving
              </button>
            )}
            <button
              type="button"
              className={runtime.paused ? "btn btn-dark" : "btn btn-outline"}
              onClick={() => setPaused(!runtime.paused)}
            >
              {runtime.paused ? "Resume Atlas" : "Pause Atlas"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AutonomyControl() {
  const { runtime, setLevel } = useAtlasRuntime();
  const current = levelDef(runtime.level);

  return (
    <section className="panel autonomy-control" aria-label="Atlas autonomy">
      <div className="autonomy-control-head">
        <div>
          <p className="briefing-kicker">Atlas autonomy</p>
          <h2>{current.name}</h2>
          <p className="panel-lead">{current.headline}</p>
        </div>
      </div>
      <div className="autonomy-level-row" role="tablist" aria-label="Autonomy level">
        {AUTONOMY_LEVELS.map((level) => (
          <button
            key={level.id}
            type="button"
            role="tab"
            aria-selected={runtime.level === level.id}
            className={runtime.level === level.id ? "active" : undefined}
            onClick={() => setLevel(level.id)}
          >
            {level.name}
          </button>
        ))}
      </div>
      <div className="autonomy-split">
        <div>
          <h3>Atlas can</h3>
          <ul>
            {current.can.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Atlas must ask you before</h3>
          <ul>
            {current.mustAsk.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
