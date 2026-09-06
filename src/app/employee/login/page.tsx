"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import { hardNavigate, sitePath } from "@/lib/hard-nav";

type DemoAccount = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  accessCode?: string;
};

export default function EmployeeLoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [demos, setDemos] = useState<DemoAccount[]>([]);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const me = await fetch("/api/employee/me", { credentials: "include" });
        if (me.ok) {
          hardNavigate("/employee");
          return;
        }
      } catch {
        /* not signed in */
      }
      try {
        const res = await fetch("/api/employee/auth/login", { credentials: "include" });
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { demos?: DemoAccount[]; demoMode?: boolean };
        };
        if (!cancelled && json.ok && json.data?.demoMode) {
          setDemoMode(true);
          setDemos(json.data.demos || []);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/employee/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, accessCode: code }),
      });
      const json = (await res.json()) as { ok?: boolean; success?: boolean; error?: string };
      if (!res.ok || json.ok === false || json.success === false) {
        setError(json.error || "We couldn't match that email and code. Check with your manager.");
        return;
      }
      hardNavigate("/employee");
    } catch {
      setError("Could not reach Atlas. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(member: DemoAccount) {
    setEmail(member.email);
    setCode((member.accessCode || "").toUpperCase());
    setError("");
  }

  return (
    <div className="auth-page">
      <div className="container auth-wrap auth-wrap-narrow">
        <div className="auth-brand">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Employee sign-in</h1>
          <p>Sign in with the email and access code your manager gave you to see your tasks.</p>
        </div>

        <div className="panel auth-card">
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Work email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@business.local"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Access code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                autoCapitalize="characters"
                required
              />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="btn btn-dark" type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in to my page"}
            </button>
          </form>

          {demoMode && demos.length > 0 ? (
            <>
              <div className="auth-divider">
                <span>demo accounts</span>
              </div>
              <div className="list">
                {demos.map((member) => (
                  <div className="list-row" key={member.id}>
                    <span className="badge">{member.accessCode}</span>
                    <p>
                      <strong>{member.name}</strong>
                      <span className="muted-line">{member.email}</span>
                    </p>
                    <button className="btn btn-outline" type="button" onClick={() => fillDemo(member)}>
                      Use
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <p className="muted-line" style={{ marginTop: "1rem" }}>
            Are you the owner? <a href={sitePath("/login")}>Sign in to Atlas</a>
          </p>
        </div>
      </div>
    </div>
  );
}
