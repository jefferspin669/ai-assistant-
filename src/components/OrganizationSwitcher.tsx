"use client";

import { useEffect, useState } from "react";
import { hardNavigate } from "@/lib/hard-nav";

type Membership = {
  organizationId: string;
  organizationName: string;
  role: string;
  joinedAt: string;
};

/**
 * Switch the atlas_session cookie to another active membership.
 * Reloads so tenant-scoped UI picks up the new org.
 */
export function OrganizationSwitcher({ className }: { className?: string }) {
  const [currentId, setCurrentId] = useState("");
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/organizations", { credentials: "include" });
        const json = (await res.json()) as {
          ok?: boolean;
          data?: { currentOrganizationId?: string; memberships?: Membership[] };
        };
        if (!res.ok || !json.data) return;
        setCurrentId(json.data.currentOrganizationId || "");
        setMemberships(json.data.memberships || []);
      } catch {
        /* guest / unauthenticated */
      }
    })();
  }, []);

  if (memberships.length < 2) return null;

  async function onSwitch(organizationId: string) {
    if (!organizationId || organizationId === currentId || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) {
        setError(json.error || "Could not switch organization.");
        return;
      }
      hardNavigate(typeof window !== "undefined" ? window.location.pathname : "/app");
    } catch {
      setError("Could not reach Atlas.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className || "org-switcher"}>
      <label className="form-grid">
        Workspace
        <select
          value={currentId}
          disabled={busy}
          onChange={(e) => void onSwitch(e.target.value)}
          aria-label="Switch organization"
        >
          {memberships.map((m) => (
            <option key={m.organizationId} value={m.organizationId}>
              {m.organizationName} ({m.role})
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
