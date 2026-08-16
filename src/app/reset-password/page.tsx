"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { hardNavigate, sitePath } from "@/lib/hard-nav";

function ResetForm() {
  const params = useSearchParams();
  const { resetPassword } = useAccount();
  const [token, setToken] = useState(params.get("token") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const result = resetPassword(token, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    hardNavigate("/app/account");
  }

  return (
    <form className="panel auth-card" onSubmit={onSubmit}>
      <div className="form-grid">
        <label>
          Reset token
          <input value={token} onChange={(e) => setToken(e.target.value)} required />
        </label>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8+ characters with letters and numbers"
            autoComplete="new-password"
            required
          />
        </label>
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="auth-actions">
        <button className="btn btn-dark" type="submit">
          Update password
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
          <p>Paste your reset token and set a strong password.</p>
        </div>
        <Suspense fallback={<div className="panel auth-card">Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
