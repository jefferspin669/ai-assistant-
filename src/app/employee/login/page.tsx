"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  authenticateEmployee,
  employeeAccessCode,
  loadSignedInEmployee,
  loadTeamMembers,
  saveEmployeeSession,
  seedDemoTeamIfEmpty,
  updatePresence,
  type TeamPerson,
} from "@/lib/user-workspace";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Make sure there is at least a demo roster so the portal is usable.
    seedDemoTeamIfEmpty();
    if (loadSignedInEmployee()) {
      router.replace("/employee");
      return;
    }
    setMembers(loadTeamMembers());
    setReady(true);
  }, [router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const member = authenticateEmployee(email, code);
    if (!member) {
      setError("We couldn't match that email and code. Check with your manager.");
      return;
    }
    saveEmployeeSession(member.id);
    updatePresence(member.id, { clockedIn: true, manualStatus: "working", touchActive: true });
    router.push("/employee");
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
            Are you the owner? <Link href="/login">Sign in to Atlas</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
