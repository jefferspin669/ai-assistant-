"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import {
  authenticateEmployee,
  employeeAccessCode,
  loadSignedInEmployee,
  loadTeamMembers,
  saveEmployeeSession,
  seedDemoTeamIfEmpty,
  type TeamPerson,
} from "@/lib/user-workspace";
import { hardNavigate, sitePath } from "@/lib/hard-nav";

export default function EmployeeLoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Make sure there is at least a demo roster so the portal is usable.
    seedDemoTeamIfEmpty();
    if (loadSignedInEmployee()) {
      hardNavigate("/employee");
      return;
    }
    setMembers(loadTeamMembers());
    setReady(true);
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const member = authenticateEmployee(email, code);
    if (!member) {
      setError("We couldn't match that email and code. Check with your manager.");
      return;
    }
    saveEmployeeSession(member.id);
    // The employee clocks in from their Time clock — that's the single source
    // of clocked-in/online state, so we don't force presence here.
    hardNavigate("/employee");
  }

  function fillDemo(member: TeamPerson) {
    setEmail(member.email);
    setCode(employeeAccessCode(member));
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
            <button className="btn btn-dark" type="submit">
              Sign in to my page
            </button>
          </form>

          {ready && members.length > 0 ? (
            <>
              <div className="auth-divider">
                <span>demo accounts</span>
              </div>
              <div className="list">
                {members.map((member) => (
                  <div className="list-row" key={member.id}>
                    <span className="badge">{employeeAccessCode(member)}</span>
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
