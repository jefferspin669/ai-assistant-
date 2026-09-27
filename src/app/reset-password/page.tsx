"use client";

import Link from "@/components/SiteLink";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { hardNavigate, sitePath } from "@/lib/hard-nav";

function ResetForm() {
  const params = useSearchParams();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) {
        setError(json.error || "Reset link is invalid or expired.");
        return;
      }
      hardNavigate("/app");
    } catch {
      setError("Could not reach Atlas. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="panel auth-card" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          Reset token
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="one-time-code"
            required
          />
        </label>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ characters"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="auth-actions">
        <button className="btn btn-dark" type="submit" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
        <p>
          <a href={sitePath("/login")}>Back to sign in</a>
        </p>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <div className="container auth-wrap auth-wrap-narrow">
        <div className="auth-brand">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Choose a new password</h1>
          <p>Use the link from your email, then set a strong password.</p>
        </div>
        <Suspense fallback={<div className="panel auth-card">Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
