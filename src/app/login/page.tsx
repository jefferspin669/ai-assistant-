"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import type { OAuthProvider, PublicAccount } from "@/lib/account";
import { loadDashboardLayout } from "@/lib/dashboard-layout";
import { hardNavigate, sitePath } from "@/lib/hard-nav";

const providers: OAuthProvider[] = ["google", "apple", "microsoft"];

function nextPath(account: PublicAccount | null | undefined) {
  if (account && !account.setup?.completed) return "/app/setup";
  try {
    return loadDashboardLayout().defaultPage || "/app";
  } catch {
    return "/app";
  }
}

export default function LoginPage() {
  const { login, verify2fa, loginOAuth, loginPasskey, account, ready } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    if (ready && account) hardNavigate(nextPath(account));
  }, [ready, account]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if ("requires2fa" in result && result.requires2fa) {
      setChallengeId(result.challengeId);
      return;
    }
    hardNavigate(nextPath("account" in result ? result.account : null));
  }

  function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!challengeId) return;
    setError("");
    const result = verify2fa(challengeId, code);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    hardNavigate("/app");
  }

  function onOAuth(provider: OAuthProvider) {
    setError("");
    const result = loginOAuth(provider);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    hardNavigate("/app/setup");
  }

  function onPasskey() {
    setError("");
    if (!email.trim()) {
      setError("Enter your email, then use passkey.");
      return;
    }
    const result = loginPasskey(email);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    hardNavigate("/app");
  }

  return (
    <div className="auth-page">
      <div className="container auth-wrap auth-wrap-narrow">
        <div className="auth-brand">
          <a href={sitePath("/")} className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </a>
          <h1>{challengeId ? "Two-factor check" : "Welcome back"}</h1>
          <p>
            {challengeId
              ? "Enter your authenticator or recovery code to finish signing in."
              : "Email/password, passkey, or Google / Apple / Microsoft."}
          </p>
        </div>

        <div className="panel auth-card">
          {challengeId ? (
            <form className="form-grid" onSubmit={onVerify}>
              <label>
                Authentication code
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="246810"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </label>
              {error ? <p className="auth-error">{error}</p> : null}
              <button className="btn btn-dark" type="submit">
                Verify and continue
              </button>
            </form>
          ) : (
            <>
              <div className="oauth-row">
                {providers.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onOAuth(provider)}
                  >
                    {provider[0].toUpperCase() + provider.slice(1)}
                  </button>
                ))}
              </div>

              <div className="auth-divider">
                <span>or email</span>
              </div>

              <form className="form-grid" onSubmit={onSubmit}>
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
                    autoComplete="current-password"
                    required
                  />
                </label>
                {error ? <p className="auth-error">{error}</p> : null}
                <div className="auth-actions">
                  <button className="btn btn-dark" type="submit">
                    Sign in
                  </button>
                  <button className="btn btn-outline" type="button" onClick={onPasskey}>
                    Sign in with passkey
                  </button>
                  <p>
                    <a href={sitePath("/forgot-password")}>Forgot password?</a>
                    {" · "}
                    <a href={sitePath("/signup")}>Create account</a>
                  </p>
                  <p>
                    Employee? <a href={sitePath("/employee/login")}>Sign in to your work page</a>
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
