"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, account, ready } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && account) router.replace("/app/account");
  }, [ready, account, router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const result = login(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/app/account");
  }

  return (
    <div className="auth-page">
      <div className="container auth-wrap auth-wrap-narrow">
        <div className="auth-brand">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Welcome back</h1>
          <p>Sign in to load your saved profile, profits, and AI employee name.</p>
        </div>

        <form className="panel auth-card" onSubmit={onSubmit}>
          <div className="form-grid">
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
          </div>

          {error ? <p className="auth-error">{error}</p> : null}

          <div className="auth-actions">
            <button className="btn btn-dark" type="submit">
              Sign in
            </button>
            <p>
              New here? <Link href="/signup">Create an account</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
