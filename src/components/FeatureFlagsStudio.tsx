"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  isFeatureEnabled,
  loadFeatureFlags,
  setFeatureFlag,
  type FeatureFlag,
} from "@/lib/feature-flags";

export function FeatureFlagsStudio() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [message, setMessage] = useState("");
  const bucket = 7;

  useEffect(() => {
    setFlags(loadFeatureFlags());
  }, []);

  return (
    <AppShell
      title="Feature flags"
      subtitle="Turn new features on for a few users first — beta calendar, new tax calculator, experimental agents, new dashboard."
    >
      <section className="panel">
        <h2>Flags</h2>
        <p className="panel-lead">
          Demo user bucket: {bucket}. Beta rollout uses percent to decide who sees a flag.
        </p>
        <ul className="manage-list">
          {flags.map((flag) => (
            <li key={flag.id}>
              <div>
                <strong>{flag.name}</strong>
                <span>
                  {flag.description} · audience {flag.audience} · {flag.rolloutPercent}% ·{" "}
                  {isFeatureEnabled(flag.id, bucket) ? "ON for you" : "OFF for you"}
                </span>
              </div>
              <div className="cta-row">
                <select
                  value={flag.audience}
                  onChange={(e) => {
                    const audience = e.target.value as FeatureFlag["audience"];
                    setFlags(
                      setFeatureFlag(flag.id, {
                        audience,
                        enabled: audience !== "off",
                        rolloutPercent: audience === "everyone" ? 100 : audience === "beta" ? 10 : 0,
                      }),
                    );
                    setMessage(`${flag.name} → ${audience}`);
                  }}
                >
                  <option value="off">Off</option>
                  <option value="internal">Internal</option>
                  <option value="beta">Beta</option>
                  <option value="everyone">Everyone</option>
                </select>
                <button
                  type="button"
                  className={`btn ${flag.enabled ? "btn-dark" : "btn-outline"}`}
                  onClick={() => {
                    setFlags(setFeatureFlag(flag.id, { enabled: !flag.enabled, audience: !flag.enabled ? "beta" : "off" }));
                    setMessage(`${flag.name} ${!flag.enabled ? "enabled" : "disabled"}`);
                  }}
                >
                  {flag.enabled ? "Enabled" : "Enable"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Safe rollout examples</h2>
        <ul className="manage-list">
          <li>
            <div>
              <strong>Beta calendar</strong>
              <span>Pilot with 10% of users before replacing Smart Calendar.</span>
            </div>
          </li>
          <li>
            <div>
              <strong>New tax calculator</strong>
              <span>Compare estimates side-by-side for internal accounts first.</span>
            </div>
          </li>
          <li>
            <div>
              <strong>Experimental AI agent</strong>
              <span>Keep confirmations on while the agent learns new tools.</span>
            </div>
          </li>
          <li>
            <div>
              <strong>New dashboard</strong>
              <span>Ship alternate widgets without moving everyone at once.</span>
            </div>
          </li>
        </ul>
      </section>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
