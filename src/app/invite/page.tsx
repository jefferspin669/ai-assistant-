"use client";

import Link from "@/components/SiteLink";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { hardNavigate, sitePath } from "@/lib/hard-nav";

function InviteForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [preview, setPreview] = useState<{
    email?: string;
    organizationName?: string;
    role?: string;
  } | null>(null);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      try {
        const res = await fetch(`/api/invitations/accept?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (res.ok && json.data) setPreview(json.data);
        else setError(json.error || "Invite is invalid or expired.");
      } catch {
        setError("Could not load invite.");
      }
    })();
  }, [token]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, fullName }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        setError(json.error || "Could not accept invite.");
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
      {preview ? (
        <p className="muted-line">
          Join <strong>{preview.organizationName}</strong> as <strong>{preview.role}</strong> (
          {preview.email}).
        </p>
      ) : null}
      <div className="form-grid">
        <label>
          Your name
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            required
          />
        </label>
      </div>
      {error ? <p className="auth-error">{error}</p> : null}
      <div className="auth-actions">
        <button className="btn btn-dark" type="submit" disabled={busy || !token}>
          {busy ? "Joining…" : "Accept invite"}
        </button>
        <p>
          <Link href={sitePath("/login")}>Already have an account? Sign in</Link>
        </p>
      </div>
    </form>
  );
}

export default function InvitePage() {
  return (
    <div className="auth-page">
      <div className="container auth-wrap auth-wrap-narrow">
        <div className="auth-brand">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Accept your invite</h1>
          <p>Create your password to join the company workspace.</p>
        </div>
        <Suspense fallback={<div className="panel auth-card">Loading invite…</div>}>
          <InviteForm />
        </Suspense>
      </div>
    </div>
  );
}
