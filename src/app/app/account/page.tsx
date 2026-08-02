"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAccount } from "@/components/AccountProvider";
import { formatMoney } from "@/lib/account";
import { industries } from "@/lib/data";

const personalities = ["Friendly", "Professional", "Funny", "Serious"] as const;

export default function AccountPage() {
  const {
    ready,
    account,
    ownerName,
    businessName,
    aiName,
    aiRole,
    aiPersonality,
    profitTotal,
    updateProfile,
    addProfit,
    removeProfit,
    logout,
  } = useAccount();

  const [name, setName] = useState(ownerName);
  const [business, setBusiness] = useState(businessName);
  const [industry, setIndustry] = useState(account?.industry ?? "HVAC");
  const [employeeName, setEmployeeName] = useState(aiName);
  const [role, setRole] = useState(aiRole);
  const [personality, setPersonality] = useState(aiPersonality);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");

  const [profitAmount, setProfitAmount] = useState("");
  const [profitNote, setProfitNote] = useState("");
  const [profitError, setProfitError] = useState("");

  useEffect(() => {
    if (!account) return;
    setName(account.ownerName);
    setBusiness(account.businessName);
    setIndustry(account.industry);
    setEmployeeName(account.aiName);
    setRole(account.aiRole);
    setPersonality(account.aiPersonality);
  }, [account]);

  function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");
    const result = updateProfile({
      ownerName: name,
      businessName: business,
      industry: String(industry),
      aiName: employeeName,
      aiPersonality: personality,
      aiRole: role,
    });
    if (!result.ok) {
      setProfileError(result.error);
      return;
    }
    setProfileMsg("Profile saved.");
  }

  function onAddProfit(e: FormEvent) {
    e.preventDefault();
    setProfitError("");
    const amount = Number(profitAmount);
    const result = addProfit(amount, profitNote);
    if (!result.ok) {
      setProfitError(result.error);
      return;
    }
    setProfitAmount("");
    setProfitNote("");
  }

  if (!ready) {
    return (
      <AppShell title="Your account" subtitle="Loading your saved profile…">
        <div className="panel">Loading…</div>
      </AppShell>
    );
  }

  if (!account) {
    return (
      <AppShell
        title="Your account"
        subtitle="Create an account to save your profile, profits, and AI name on this device."
      >
        <section className="panel account-guest">
          <h2>Save your Atlas workspace</h2>
          <p>
            Sign up once — then change your business details, add profit entries, and rename your AI
            employee anytime. Data stays in this browser for the prototype.
          </p>
          <div className="cta-row">
            <Link className="btn btn-dark" href="/signup">
              Create account
            </Link>
            <Link className="btn btn-outline" href="/login">
              Sign in
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Your account"
      subtitle={`${account.email} · profile, profits, and AI name saved on this device`}
      action={
        <button className="btn btn-outline" type="button" onClick={logout}>
          Sign out
        </button>
      }
    >
      <div className="account-layout">
        <section className="panel">
          <h2>Profile</h2>
          <p className="panel-lead">Update your info anytime — it sticks for the next visit.</p>
          <form className="form-grid" onSubmit={onSaveProfile}>
            <label>
              Your name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Business name
              <input value={business} onChange={(e) => setBusiness(e.target.value)} required />
            </label>
            <label>
              Industry
              <select value={String(industry)} onChange={(e) => setIndustry(e.target.value)}>
                {industries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                {!industries.includes(industry as (typeof industries)[number]) ? (
                  <option value={String(industry)}>{String(industry)}</option>
                ) : null}
              </select>
            </label>
            <label>
              AI employee name
              <input
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                required
              />
            </label>
            <label>
              AI role
              <input value={role} onChange={(e) => setRole(e.target.value)} required />
            </label>
            <label>
              Personality
              <select value={personality} onChange={(e) => setPersonality(e.target.value)}>
                {personalities.map((p) => (
                  <option key={p}>{p}</option>
                ))}
                {!personalities.includes(personality as (typeof personalities)[number]) ? (
                  <option value={personality}>{personality}</option>
                ) : null}
              </select>
            </label>
            {profileError ? <p className="auth-error">{profileError}</p> : null}
            {profileMsg ? <p className="auth-success">{profileMsg}</p> : null}
            <button className="btn btn-dark" type="submit">
              Save profile
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Profits</h2>
          <p className="panel-lead">
            Track what you’ve made. Add positive or negative amounts to keep a running total.
          </p>
          <div className="profit-total">
            <span>Running total</span>
            <strong>{formatMoney(profitTotal)}</strong>
          </div>
          <form className="form-grid profit-form" onSubmit={onAddProfit}>
            <label>
              Amount (USD)
              <input
                type="number"
                step="1"
                value={profitAmount}
                onChange={(e) => setProfitAmount(e.target.value)}
                placeholder="2500"
                required
              />
            </label>
            <label>
              Note
              <input
                value={profitNote}
                onChange={(e) => setProfitNote(e.target.value)}
                placeholder="March jobs closed"
              />
            </label>
            {profitError ? <p className="auth-error">{profitError}</p> : null}
            <button className="btn btn-dark" type="submit">
              Add to profits
            </button>
          </form>

          <ul className="profit-list">
            {account.profits.length === 0 ? (
              <li className="profit-empty">No profit entries yet — add your first one above.</li>
            ) : (
              account.profits.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong className={entry.amount >= 0 ? "profit-pos" : "profit-neg"}>
                      {entry.amount >= 0 ? "+" : ""}
                      {formatMoney(entry.amount)}
                    </strong>
                    <span>{entry.note}</span>
                    <small>
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="ghost-link"
                    onClick={() => removeProfit(entry.id)}
                  >
                    Remove
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="panel account-preview">
          <h2>AI preview</h2>
          <p className="panel-lead">
            {employeeName} will greet callers using your saved name.
          </p>
          <div className="chat-mock">
            <div className="bubble bubble-ai">
              Hello! Thanks for calling {business || "your business"}. I’m {employeeName}. How can I
              help you today?
            </div>
          </div>
          <p className="account-hint">
            Prefer the guided setup?{" "}
            <Link href="/onboarding">Customize your AI employee</Link> — changes still save here when
            you’re signed in.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
