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

type ServerLoginResult = {
  ok?: boolean;
  success?: boolean;
  error?: string;
  data?: {
    mfaRequired?: boolean;
    challengeId?: string | null;
    full_name?: string;
    userId?: string;
  };
};

/**
 * Owner login goes through /api/auth/login so the atlas_session cookie matches
 * protected APIs. AccountProvider remains for profile/UI state after success.
 */
export default function LoginPage() {
  const { loginOAuth, loginPasskey, account, ready, refresh } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && account) hardNavigate(nextPath(account));
  }, [ready, account]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = (await res.json()) as ServerLoginResult;
      if (!res.ok || json.ok === false || json.success === false) {
        setError(json.error || "Email or password doesn’t match.");
        return;
      }
      if (json.data?.mfaRequired) {
        setChallengeId(json.data.challengeId || "mfa");
        return;
      }
      refresh();
      hardNavigate("/app");
    } catch {
      setError("Could not reach Atlas. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(e: FormEvent) {
    e.preventDefault();
    if (!challengeId) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = (await res.json()) as ServerLoginResult;
      if (!res.ok || json.ok === false || json.success === false) {
        setError(json.error || "Invalid MFA code.");
        return;
      }
      refresh();
      hardNavigate("/app");
    } catch {
      setError("Could not verify MFA. Try again.");
    } finally {
      setBusy(false);
    }
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
              ? "Enter your authenticator code to finish signing in."
              : "Server session login — email/password issues an atlas_session cookie for APIs."}
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
              <button className="btn btn-dark" type="submit" disabled={busy}>
                {busy ? "Verifying…" : "Verify and continue"}
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
                    {provider}
                  </button>
                ))}
              </div>
              <form className="form-grid" onSubmit={onSubmit}>
                <label>
                  Email
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <button className="btn btn-dark" type="submit" disabled={busy}>
                  {busy ? "Signing in…" : "Sign in"}
                </button>
              </form>
              <p className="muted-line" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
                Seed accounts (dev): owner <code>demo@atlas.ai</code> / <code>atlas-demo</code>,
                manager <code>alex@atlas.ai</code> / <code>atlas-manager</code>, worker{" "}
                <code>sam@atlas.ai</code> / <code>atlas-worker</code>. Field portal:{" "}
                <a href={sitePath("/employee/login")}>/employee/login</a>
              </p>
              <button className="btn btn-outline" type="button" onClick={onPasskey}>
                Use passkey
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
