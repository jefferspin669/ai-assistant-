"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { industries } from "@/lib/data";

const personalities = ["Friendly", "Professional", "Funny", "Serious"] as const;

export default function SignupPage() {
  const router = useRouter();
  const { signup, account, ready } = useAccount();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState<string>(industries[1]);
  const [aiName, setAiName] = useState("Sarah");
  const [aiPersonality, setAiPersonality] = useState<(typeof personalities)[number]>("Friendly");

  useEffect(() => {
    if (ready && account) router.replace("/app/account");
  }, [ready, account, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const result = signup({
      email,
      password,
      ownerName,
      businessName,
      industry,
      aiName,
      aiPersonality,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/app/account");
  }

  return (
    <div className="auth-page">
      <div className="container auth-wrap">
        <div className="auth-brand">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Create your account</h1>
          <p>
            Save your business profile, track profits, and name your AI employee — everything stays
            on this device for the prototype.
          </p>
        </div>

        <form className="panel auth-card" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              Your name
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Jeff"
                autoComplete="name"
                required
              />
            </label>
            <label>
              Business name
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Summit Home Services"
                autoComplete="organization"
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 4 characters"
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Industry
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {industries.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="auth-split">
              <label>
                AI employee name
                <input
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="Sarah"
                  required
                />
              </label>
              <label>
                Personality
                <select
                  value={aiPersonality}
                  onChange={(e) => setAiPersonality(e.target.value as typeof aiPersonality)}
                >
                  {personalities.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="auth-actions">
            <button className="btn btn-dark" type="submit">
              Create account
            </button>
            <p>
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
