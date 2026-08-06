"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { apiGet, apiSend } from "@/lib/backend/client";
import { WORKSPACE_DOMAINS } from "@/lib/backend/domains";

type HealthData = {
  status: string;
  engine: string;
  persistence: string;
  workspaceFile: string;
  dataDir: string;
  workspace: {
    updatedAt: string;
    domains: { domain: string; present: boolean; size: number }[];
  };
  stats: Record<string, number>;
};

type TaskRow = { id: string; title: string; status: string };

export default function BackendPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    setError("");
    const [healthRes, tasksRes] = await Promise.all([
      apiGet<HealthData>("/api/health"),
      apiGet<TaskRow[]>("/api/tasks"),
    ]);
    if (healthRes.ok) setHealth(healthRes.data);
    else setError(healthRes.error);
    if (tasksRes.ok) setTasks(tasksRes.data);
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function createDemoTask() {
    const result = await apiSend<TaskRow>("/api/tasks", "POST", {
      title: `Backend demo task ${new Date().toLocaleTimeString()}`,
      notes: "Created via /api/tasks",
      priority: "normal",
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Created task “${result.data.title}” on the file-backed backend.`);
    await refresh();
  }

  async function pingWorkspace() {
    const result = await apiSend("/api/workspace/notes", "PUT", {
      data: [
        {
          id: `note_${Date.now()}`,
          title: "Backend heartbeat",
          body: "Workspace API write OK",
          at: new Date().toISOString(),
        },
      ],
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Workspace notes domain written to `.data/workspace.json`.");
    await refresh();
  }

  return (
    <AppShell
      title="Atlas Backend"
      subtitle="File-backed API for architecture DB + product workspace domains. Survives refresh and restarts."
      action={
        <Link className="btn btn-outline" href="/app/architecture">
          Architecture
        </Link>
      }
    >
      {message ? <p className="auth-success">{message}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}

      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Status</span>
          <strong>{health?.status || "…"}</strong>
          <small>{health?.engine || "loading"}</small>
        </div>
        <div className="stat">
          <span>DB file</span>
          <strong>{health?.persistence?.includes("file") ? "On disk" : "…"}</strong>
          <small>{health?.persistence || ""}</small>
        </div>
        <div className="stat">
          <span>Workspace</span>
          <strong>{health?.workspaceFile?.includes("file") ? "On disk" : "…"}</strong>
          <small>{health?.dataDir || ""}</small>
        </div>
        <div className="stat">
          <span>API tasks</span>
          <strong>{tasks.length}</strong>
          <small>From /api/tasks</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Live checks</h2>
          <p className="panel-lead">Hit the real Next.js route handlers — not browser localStorage.</p>
          <div className="cta-row">
            <button type="button" className="btn btn-dark" onClick={() => void refresh()}>
              Refresh health
            </button>
            <button type="button" className="btn btn-outline" onClick={() => void createDemoTask()}>
              Create API task
            </button>
            <button type="button" className="btn btn-outline" onClick={() => void pingWorkspace()}>
              Write workspace note
            </button>
          </div>
          <h3 style={{ marginTop: "1rem" }}>Architecture tables</h3>
          <ul className="manage-list">
            {health
              ? Object.entries(health.stats).map(([label, count]) => (
                  <li key={label}>
                    <div>
                      <strong>{label}</strong>
                      <span>{count} rows</span>
                    </div>
                  </li>
                ))
              : null}
          </ul>
        </section>

        <section className="panel">
          <h2>Workspace domains</h2>
          <p className="panel-lead">
            Product pages (tasks, tax, calendar, connections…) sync here via `/api/workspace/:domain`.
          </p>
          <ul className="manage-list">
            {(health?.workspace.domains ||
              WORKSPACE_DOMAINS.map((domain) => ({ domain, present: false, size: 0 }))).map(
              (item) => (
                <li key={item.domain}>
                  <div>
                    <strong>{item.domain}</strong>
                    <span>
                      {item.present ? `${item.size} bytes on disk` : "empty — will fill when you use the page"}
                    </span>
                  </div>
                  <span className={`badge ${item.present ? "ok" : ""}`}>
                    {item.present ? "synced" : "idle"}
                  </span>
                </li>
              ),
            )}
          </ul>
          <h3 style={{ marginTop: "1rem" }}>Key routes</h3>
          <ul className="plain-list">
            <li>
              <code>GET /api/health</code>
            </li>
            <li>
              <code>GET|PUT /api/workspace/:domain</code>
            </li>
            <li>
              <code>GET|POST /api/tasks</code>
            </li>
            <li>
              <code>GET|POST /api/calendar/events</code>
            </li>
            <li>
              <code>GET|POST /api/transactions</code> · <code>POST /api/taxes/calculate</code>
            </li>
            <li>
              <code>POST /api/ai/chat</code> · <code>GET /api/files</code>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
