"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useState } from "react";
import { useAccount } from "@/components/AccountProvider";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAccount();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setToken("");
    const result = forgotPassword(email);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(result.message);
    if (result.token) setToken(result.token);
  }

  return (
    <div className="auth-page">
      <div className="container auth-wrap auth-wrap-narrow">
        <div className="auth-brand">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Password reset</h1>
          <p>We’ll create a reset token for this demo (normally emailed to you).</p>
        </div>

        <form className="panel auth-card" onSubmit={onSubmit}>
          <div className="form-grid">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
          </div>
          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-success">{message}</p> : null}
          {token ? (
            <p className="account-hint">
              Demo token: <code>{token}</code>
              <br />
              <Link href={`/reset-password?token=${encodeURIComponent(token)}`}>
                Continue to choose a new password
              </Link>
            </p>
          ) : null}
          <div className="auth-actions">
            <button className="btn btn-dark" type="submit">
              Send reset link
            </button>
            <p>
              <Link href="/login">Back to sign in</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
