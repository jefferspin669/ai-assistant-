"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { industries } from "@/lib/data";
import { hardNavigate } from "@/lib/hard-nav";
import {
  COLOR_CATEGORY_IDS,
  SETUP_APPS,
  SETUP_GOALS,
  TIMEZONES,
  US_STATES,
  completeFirstTimeSetup,
  defaultSetupAnswers,
} from "@/lib/setup";
import { DEFAULT_CATEGORIES } from "@/lib/smart-calendar";

const STEPS = [
  "Account type",
  "Business",
  "Timezone & tax",
  "Goals",
  "Colors",
  "Notifications",
  "Apps",
] as const;

export function SetupWizard() {
  const { account, ready, refresh } = useAccount();
  const [step, setStep] = useState(0);
  const [redo, setRedo] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState(() =>
    defaultSetupAnswers({
      businessName: account?.businesses.find((b) => b.id === account.activeBusinessId)?.name,
      industry: account?.businesses.find((b) => b.id === account.activeBusinessId)?.industry,
      timezone: account?.personal.timezone,
    }),
  );

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  if (!ready) return null;

  if (!account) {
    return (
      <div className="panel">
        <h2>Sign in to continue setup</h2>
        <p className="panel-lead">Atlas personalizes your starter dashboard after you create an account.</p>
        <div className="cta-row">
          <Link className="btn btn-dark" href="/signup">
            Create account
          </Link>
          <Link className="btn btn-outline" href="/login">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  if (account.setup?.completed && !redo) {
    return (
      <div className="panel">
        <p className="briefing-kicker">Setup complete</p>
        <h2>Your Atlas workspace is ready</h2>
        <p className="panel-lead">
          {account.setup.accountType === "business" ? "Business" : "Personal"} account · tax state{" "}
          {account.setup.taxState} · {account.setup.goals.length} goals
        </p>
        <div className="cta-row">
          <Link className="btn btn-dark" href="/app">
            Open starter dashboard
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setRedo(true);
              setStep(0);
              setAnswers(
                defaultSetupAnswers({
                  businessName: account.businesses.find((b) => b.id === account.activeBusinessId)?.name,
                  industry: account.businesses.find((b) => b.id === account.activeBusinessId)?.industry,
                  timezone: account.personal.timezone,
                }),
              );
            }}
          >
            Run setup again
          </button>
        </div>
      </div>
    );
  }

  function next() {
    setError("");
    if (step === 1 && answers.accountType === "business" && !answers.businessName.trim()) {
      setError("Enter a business name.");
      return;
    }
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  }

  function back() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  function finish() {
    setError("");
    const result = completeFirstTimeSetup(answers);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
    hardNavigate("/app");
  }

  function toggleGoal(goal: string) {
    setAnswers((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter((g) => g !== goal) : [...prev.goals, goal],
    }));
  }

  function toggleApp(id: string) {
    setAnswers((prev) => ({
      ...prev,
      connectApps: prev.connectApps.includes(id)
        ? prev.connectApps.filter((a) => a !== id)
        : [...prev.connectApps, id],
    }));
  }

  return (
    <div className="setup-wizard">
      <section className="panel setup-hero">
        <p className="briefing-kicker">First-time setup</p>
        <h2>Welcome, {account.personal.fullName.split(" ")[0]}.</h2>
        <p className="panel-lead">
          Answer a few questions and Atlas will build your starter dashboard automatically.
        </p>
        <div className="setup-progress" aria-hidden>
          <div className="setup-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="setup-steps">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`biz-chip ${index === step ? "active" : ""}`}
              onClick={() => setStep(index)}
            >
              {index + 1}. {label}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        {step === 0 && (
          <>
            <h3>Personal or business?</h3>
            <p className="panel-lead">This shapes your dashboard, tax defaults, and calendar layers.</p>
            <div className="cta-row">
              {(["personal", "business"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`btn ${answers.accountType === type ? "btn-dark" : "btn-outline"}`}
                  onClick={() => setAnswers((a) => ({ ...a, accountType: type }))}
                >
                  {type === "personal" ? "Personal account" : "Business account"}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h3>{answers.accountType === "personal" ? "What should we call your workspace?" : "Business name & industry"}</h3>
            <div className="form-grid">
              <label>
                {answers.accountType === "personal" ? "Workspace name" : "Business name"}
                <input
                  value={answers.businessName}
                  onChange={(e) => setAnswers((a) => ({ ...a, businessName: e.target.value }))}
                  placeholder={answers.accountType === "personal" ? "My Atlas" : "Johnson Construction"}
                />
              </label>
              <label>
                Industry
                <select
                  value={answers.industry}
                  onChange={(e) => setAnswers((a) => ({ ...a, industry: e.target.value }))}
                >
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Timezone & tax state</h3>
            <div className="form-grid">
              <label>
                Timezone
                <select
                  value={answers.timezone}
                  onChange={(e) => setAnswers((a) => ({ ...a, timezone: e.target.value }))}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tax state
                <select
                  value={answers.taxState}
                  onChange={(e) => setAnswers((a) => ({ ...a, taxState: e.target.value }))}
                >
                  {US_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Main goals</h3>
            <p className="panel-lead">Pick what Atlas should emphasize on your starter dashboard.</p>
            <div className="toggle-grid">
              {SETUP_GOALS.map((goal) => (
                <label key={goal} className="check-row">
                  <input
                    type="checkbox"
                    checked={answers.goals.includes(goal)}
                    onChange={() => toggleGoal(goal)}
                  />
                  <span>{goal}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3>Preferred calendar colors</h3>
            <p className="panel-lead">These update your Smart Calendar categories.</p>
            <div className="form-grid setup-colors">
              {COLOR_CATEGORY_IDS.map((id) => {
                const cat = DEFAULT_CATEGORIES.find((c) => c.id === id);
                return (
                  <label key={id}>
                    {cat?.label || id}
                    <input
                      type="color"
                      value={answers.calendarColors[id] || cat?.color || "#3b82f6"}
                      onChange={(e) =>
                        setAnswers((a) => ({
                          ...a,
                          calendarColors: { ...a.calendarColors, [id]: e.target.value },
                        }))
                      }
                    />
                  </label>
                );
              })}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h3>Notification preferences</h3>
            <div className="toggle-grid">
              {(
                [
                  ["push", "Push"],
                  ["email", "Email"],
                  ["sms", "SMS"],
                  ["desktop", "Desktop"],
                  ["calendar", "Calendar alerts"],
                  ["tax", "Tax & billing"],
                  ["ai", "Atlas AI updates"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="check-row">
                  <input
                    type="checkbox"
                    checked={answers.notifications[key]}
                    onChange={(e) =>
                      setAnswers((a) => ({
                        ...a,
                        notifications: { ...a.notifications, [key]: e.target.checked },
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <h3>Apps to connect</h3>
            <p className="panel-lead">Atlas marks these as connected for day-one workflows (demo links).</p>
            <div className="toggle-grid">
              {SETUP_APPS.map((app) => (
                <label key={app.id} className="check-row">
                  <input
                    type="checkbox"
                    checked={answers.connectApps.includes(app.id)}
                    onChange={() => toggleApp(app.id)}
                  />
                  <span>{app.name}</span>
                </label>
              ))}
            </div>
          </>
        )}

        {error ? <p className="auth-error">{error}</p> : null}

        <div className="cta-row" style={{ marginTop: "1.25rem" }}>
          {step > 0 ? (
            <button type="button" className="btn btn-outline" onClick={back}>
              Back
            </button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-dark" onClick={next}>
              Continue
            </button>
          ) : (
            <button type="button" className="btn btn-dark" onClick={finish}>
              Create starter dashboard
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
