"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useState } from "react";
import { sitePath } from "@/lib/hard-nav";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: { sent?: boolean; resetUrl?: string; resetToken?: string };
      };
      if (!res.ok || json.ok === false) {
        setError(json.error || "Could not start a reset.");
        return;
      }
      setMessage(
        "If that email is on file, we sent a reset link. Check your inbox (or the link below in development).",
      );
      if (json.data?.resetUrl) setResetUrl(json.data.resetUrl);
    } catch {
      setError("Could not reach Atlas. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="container auth-wrap auth-wrap-narrow">
        <div className="auth-brand">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Password reset</h1>
          <p>Enter your account email. We’ll send a one-time reset link.</p>
        </div>

        <form className="panel auth-card" onSubmit={onSubmit}>
          <div className="form-grid">
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
          </div>
          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-success">{message}</p> : null}
          {resetUrl ? (
            <p className="account-hint">
              Dev reset link:{" "}
              <a href={resetUrl.startsWith("http") ? resetUrl : resetUrl}>Open reset page</a>
            </p>
          ) : null}
          <div className="auth-actions">
            <button className="btn btn-dark" type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <p>
              <Link href={sitePath("/login")}>Back to sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
