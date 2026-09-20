"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Member = {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
};

type Project = { id: string; name: string; description: string };
type Task = {
  id: string;
  title: string;
  status: string;
  assigneeId: string | null;
  projectId: string | null;
};
type Approval = { id: string; action_type: string; status: string; payload: Record<string, unknown> };
type Audit = { id: string; action: string; entity_type: string; created_at: string };

type Snapshot = {
  members: Member[];
  projects: Project[];
  tasks: Task[];
  approvals: Approval[];
  audit: Audit[];
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const json = (await res.json()) as { ok?: boolean; success?: boolean; data?: T; error?: string };
  if (!json.ok && !json.success) throw new Error(json.error || "Request failed");
  return json.data as T;
}

/**
 * Server-backed invite → project → task → approve notify flow.
 * Starts empty — no demo projects, tasks, or approvals.
 */
export function TeamOpsPanel() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [flash, setFlash] = useState("");
  const [error, setError] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerId, setCustomerId] = useState("");

  const refresh = useCallback(async () => {
    await fetch("/api/session");
    const data = await api<Snapshot>("/api/team-ops");
    setSnap(data);
    if (!assigneeId) {
      const worker = data.members.find((m) => m.role === "employee" && m.status === "active");
      if (worker) setAssigneeId(worker.userId);
    }
  }, [assigneeId]);

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, [refresh]);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/team-ops", {
        method: "POST",
        body: JSON.stringify({
          action: "invite",
          email: inviteEmail,
          fullName: inviteName || undefined,
          role: "employee",
        }),
      });
      setFlash(`Invited ${inviteEmail}. Activate them to assign work.`);
      setInviteEmail("");
      setInviteName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    }
  }

  async function onAccept(memberId: string) {
    setError("");
    try {
      await api("/api/team-ops", {
        method: "POST",
        body: JSON.stringify({ action: "accept", memberId }),
      });
      setFlash("Worker activated.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Accept failed");
    }
  }

  async function onCreateProject(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/team-ops", {
        method: "POST",
        body: JSON.stringify({ action: "create_project", name: projectName }),
      });
      setFlash(`Created project “${projectName}”.`);
      setProjectName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Project create failed");
    }
  }

  async function onCreateCustomer(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const customer = await api<{ id: string }>("/api/customers", {
        method: "POST",
        body: JSON.stringify({
          name: customerName,
          phone: customerPhone || undefined,
          status: "active",
        }),
      });
      setCustomerId(customer.id);
      setFlash(`Customer “${customerName}” ready for notifications.`);
      setCustomerName("");
      setCustomerPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Customer create failed");
    }
  }

  async function onAssignTask(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const projectId = snap?.projects[0]?.id;
      if (!projectId) throw new Error("Create a project first.");
      if (!assigneeId) throw new Error("Activate a worker first.");
      await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: taskTitle,
          projectId,
          assigneeId,
          customerId: customerId || null,
          notifyOnComplete: Boolean(customerId),
        }),
      });
      setFlash(`Assigned “${taskTitle}”.`);
      setTaskTitle("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    }
  }

  async function onComplete(taskId: string) {
    setError("");
    try {
      await api("/api/team-ops", {
        method: "POST",
        body: JSON.stringify({ action: "complete_task", taskId }),
      });
      setFlash("Worker completed the task. Customer notification awaits your approval.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Complete failed");
    }
  }

  async function onApprove(id: string) {
    setError("");
    try {
      await api("/api/approvals", {
        method: "POST",
        body: JSON.stringify({ id, decision: "approved" }),
      });
      setFlash("Notification approved — Atlas sends it once.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    }
  }

  const empty =
    snap &&
    snap.projects.length === 0 &&
    snap.tasks.length === 0 &&
    snap.members.filter((m) => m.role === "employee").length === 0;

  return (
    <section className="training-studio" data-testid="team-ops-panel">
      <header style={{ marginBottom: "1.25rem" }}>
        <h2 style={{ margin: 0, fontSize: "1.35rem" }}>Team operations</h2>
        <p style={{ margin: "0.35rem 0 0", opacity: 0.75, maxWidth: "42rem" }}>
          Invite a worker, create a project, assign a task, complete it, then approve the customer
          notification. This path uses the server database — no demo seed.
        </p>
      </header>

      {flash ? <p className="badge ok" data-testid="team-ops-flash">{flash}</p> : null}
      {error ? <p className="badge warn" data-testid="team-ops-error">{error}</p> : null}

      {empty ? (
        <p data-testid="team-ops-empty" style={{ opacity: 0.8 }}>
          No workers, projects, or tasks yet. Start by inviting someone.
        </p>
      ) : null}

      <div className="stat-grid metrics-dense" style={{ marginBottom: "1.25rem" }}>
        <div className="stat">
          <span>Workers</span>
          <strong>{snap?.members.filter((m) => m.role === "employee").length ?? 0}</strong>
          <small>Invited or active</small>
        </div>
        <div className="stat">
          <span>Projects</span>
          <strong>{snap?.projects.length ?? 0}</strong>
          <small>Live portfolio</small>
        </div>
        <div className="stat">
          <span>Tasks</span>
          <strong>{snap?.tasks.length ?? 0}</strong>
          <small>Assigned work</small>
        </div>
        <div className="stat">
          <span>Approvals</span>
          <strong>{snap?.approvals.length ?? 0}</strong>
          <small>Pending notify</small>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}>
        <form onSubmit={onInvite} data-testid="team-ops-invite">
          <h3>1. Invite worker</h3>
          <input
            data-testid="invite-email"
            placeholder="worker@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <input
            data-testid="invite-name"
            placeholder="Full name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
          />
          <button type="submit">Send invite</button>
        </form>

        <form onSubmit={onCreateProject} data-testid="team-ops-project">
          <h3>2. Create project</h3>
          <input
            data-testid="project-name"
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
          <button type="submit">Create project</button>
        </form>

        <form onSubmit={onCreateCustomer} data-testid="team-ops-customer">
          <h3>3. Customer (for notify)</h3>
          <input
            data-testid="customer-name"
            placeholder="Customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
          <input
            data-testid="customer-phone"
            placeholder="+15555550199"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
          <button type="submit">Add customer</button>
          {customerId ? <small>Linked: {customerId}</small> : null}
        </form>

        <form onSubmit={onAssignTask} data-testid="team-ops-task">
          <h3>4. Assign task</h3>
          <input
            data-testid="task-title"
            placeholder="Task title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
          />
          <select
            data-testid="task-assignee"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Select worker</option>
            {(snap?.members || [])
              .filter((m) => m.status === "active" && m.role === "employee")
              .map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name || m.email}
                </option>
              ))}
          </select>
          <button type="submit">Assign to worker</button>
        </form>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <h3>Invites</h3>
        {(snap?.members || []).filter((m) => m.role === "employee").length === 0 ? (
          <p style={{ opacity: 0.7 }}>No workers invited yet.</p>
        ) : (
          <ul data-testid="team-ops-members">
            {(snap?.members || [])
              .filter((m) => m.role === "employee")
              .map((m) => (
                <li key={m.id}>
                  {m.name || m.email} · {m.status}
                  {m.status === "invited" ? (
                    <button type="button" data-testid={`accept-${m.id}`} onClick={() => void onAccept(m.id)}>
                      Activate
                    </button>
                  ) : null}
                </li>
              ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <h3>Tasks</h3>
        {(snap?.tasks || []).length === 0 ? (
          <p style={{ opacity: 0.7 }} data-testid="tasks-empty">
            No assigned tasks yet.
          </p>
        ) : (
          <ul data-testid="team-ops-tasks">
            {(snap?.tasks || []).map((t) => (
              <li key={t.id}>
                {t.title} · {t.status}
                {t.status !== "completed" ? (
                  <button type="button" data-testid={`complete-${t.id}`} onClick={() => void onComplete(t.id)}>
                    Mark complete
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <h3>Pending approvals</h3>
        {(snap?.approvals || []).length === 0 ? (
          <p style={{ opacity: 0.7 }}>No customer notifications waiting.</p>
        ) : (
          <ul data-testid="team-ops-approvals">
            {(snap?.approvals || []).map((a) => (
              <li key={a.id}>
                {a.action_type}
                <button type="button" data-testid={`approve-${a.id}`} onClick={() => void onApprove(a.id)}>
                  Approve send
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <h3>Audit log</h3>
        {(snap?.audit || []).length === 0 ? (
          <p style={{ opacity: 0.7 }} data-testid="audit-empty">
            Audit trail is empty until you take an action.
          </p>
        ) : (
          <ul data-testid="team-ops-audit">
            {(snap?.audit || []).slice(0, 12).map((row) => (
              <li key={row.id}>
                {row.action} · {row.entity_type}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
