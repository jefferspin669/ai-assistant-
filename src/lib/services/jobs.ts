import { newId, nowIso, saveDatabase } from "@/lib/db/store";
import type { SessionContext } from "@/lib/domain/types";
import { database } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import { processAutonomyQueue } from "@/lib/autonomy/worker";

export function enqueueJob(
  ctx: SessionContext,
  kind: string,
  payload: Record<string, unknown>,
) {
  const db = database();
  const job = {
    id: newId("job"),
    organization_id: ctx.organizationId,
    kind,
    payload,
    status: "queued" as const,
    created_at: nowIso(),
    run_at: null,
  };
  saveDatabase({ ...db, jobs: [job, ...db.jobs] });
  return job;
}

export function processJobs(limit = 10) {
  const autonomy = processAutonomyQueue(limit);
  const db = database();
  const queued = db.jobs
    .filter((job) => job.status === "queued" && !String(job.kind).startsWith("autonomy:"))
    .slice(0, limit);
  if (!queued.length) return { generic: [], autonomy };
  const doneIds = new Set(queued.map((job) => job.id));
  saveDatabase({
    ...db,
    jobs: db.jobs.map((job) =>
      doneIds.has(job.id) ? { ...job, status: "done" as const, run_at: nowIso() } : job,
    ),
    notifications: [
      ...queued.map((job) => ({
        id: newId("note"),
        userId: String(job.payload.userId || ""),
        organizationId: job.organization_id,
        title: `Job ${job.kind} finished`,
        body: "Background work completed.",
        read: false,
        createdAt: nowIso(),
      })),
      ...db.notifications,
    ],
  });
  return { generic: queued, autonomy };
}

export function notify(
  ctx: SessionContext,
  title: string,
  body: string,
) {
  const db = database();
  const row = {
    id: newId("note"),
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    title,
    body,
    read: false,
    createdAt: nowIso(),
  };
  saveDatabase({ ...db, notifications: [row, ...db.notifications] });
  writeAudit(ctx, { action: `notification:${title}`, entityType: "notification", entityId: row.id });
  return row;
}
