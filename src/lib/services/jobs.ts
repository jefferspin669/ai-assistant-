import { newId, nowIso, saveDatabase, enqueueAwaitedSideEffect, loadDatabase } from "@/lib/db/store";
import type { DbJob } from "@/lib/db/schema";
import type { SessionContext } from "@/lib/domain/types";
import { database } from "@/lib/services/access";
import { writeAudit } from "@/lib/services/audit";
import { processAutonomyQueue } from "@/lib/autonomy/worker";
import { recordDeadLetter } from "@/lib/queue/dead-letter";
import { hasPostgres, getDrizzle } from "@/lib/db/postgres";
import { sql } from "drizzle-orm";

const DEFAULT_MAX_ATTEMPTS = 5;
const VISIBILITY_TIMEOUT_MS = 60_000;
const RETRY_BASE_MS = 5_000;

export type EnqueueJobOptions = {
  idempotencyKey?: string;
  lane?: string;
  runAt?: string | null;
  maxAttempts?: number;
};

function stampJob(partial: Omit<DbJob, "created_at" | "updated_at" | "visible_at"> & {
  created_at?: string;
  updated_at?: string | null;
  visible_at?: string | null;
}): DbJob {
  const created = partial.created_at || nowIso();
  return {
    ...partial,
    created_at: created,
    updated_at: partial.updated_at ?? created,
    visible_at: partial.visible_at ?? partial.run_at ?? created,
    lane: partial.lane || "default",
    attempts: partial.attempts ?? 0,
    max_attempts: partial.max_attempts ?? DEFAULT_MAX_ATTEMPTS,
    claimed_at: partial.claimed_at ?? null,
    claimed_by: partial.claimed_by ?? null,
    last_error: partial.last_error ?? null,
    idempotency_key: partial.idempotency_key ?? null,
    dead_lettered_at: partial.dead_lettered_at ?? null,
    version: partial.version ?? 1,
  };
}

/** Enqueue work. Same org + idempotency key returns the existing row (no double-run). */
export function enqueueJob(
  ctx: SessionContext,
  kind: string,
  payload: Record<string, unknown>,
  options: EnqueueJobOptions = {},
) {
  const db = database();
  const key = options.idempotencyKey?.trim() || null;
  if (key) {
    const existing = db.jobs.find(
      (job) =>
        job.organization_id === ctx.organizationId &&
        job.idempotency_key === key &&
        job.status !== "failed",
    );
    if (existing) return existing;
  }

  const job = stampJob({
    id: newId("job"),
    organization_id: ctx.organizationId,
    kind,
    payload,
    status: "queued",
    run_at: options.runAt ?? null,
    lane: options.lane || "default",
    max_attempts: options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    idempotency_key: key,
  });
  saveDatabase({ ...db, jobs: [job, ...db.jobs] });
  // assign_task is drained by the durable DB queue on /api/autonomy/tick so policy
  // can be rechecked immediately before createOrgTask. Other kinds may use BullMQ.
  if (
    typeof window === "undefined" &&
    process.env.REDIS_URL?.trim() &&
    kind !== "autonomy:assign_task"
  ) {
    enqueueAwaitedSideEffect(() =>
      import("@/lib/queue/bullmq").then((mod) =>
        mod.addBullJob(kind, {
          jobId: job.id,
          organizationId: ctx.organizationId,
          userId: ctx.userId,
          payload: job.payload,
        }),
      ),
    );
  }
  return job;
}

function isClaimable(job: DbJob, now: string): boolean {
  if (String(job.kind).startsWith("autonomy:")) return false;
  if (job.dead_lettered_at) return false;
  const visible = job.visible_at || job.run_at || job.created_at;
  if (visible > now) return false;
  if (job.status === "queued") return true;
  // Lease expired while still marked running — reclaim.
  if (job.status === "running" && job.claimed_at) {
    const leaseEnd = new Date(job.claimed_at).getTime() + VISIBILITY_TIMEOUT_MS;
    return leaseEnd <= Date.now();
  }
  return false;
}

/**
 * Atomically claim up to `limit` due jobs for this worker.
 * JSON path: compare-and-set on status/version in a single saveDatabase.
 * Postgres path: UPDATE … WHERE id IN (SELECT … FOR UPDATE SKIP LOCKED).
 */
export async function claimNextJobs(
  workerId: string,
  limit = 10,
): Promise<DbJob[]> {
  const now = nowIso();

  if (hasPostgres()) {
    try {
      // Empty result means nothing is due — do not also claim from the JSON mirror.
      return await claimNextJobsPostgres(workerId, limit, now);
    } catch {
      /* SQL claim unavailable — fall through to in-memory CAS below */
    }
  }

  const db = loadDatabase();
  const candidates = db.jobs
    .filter((job) => isClaimable(job, now))
    .sort((a, b) => String(a.visible_at || a.created_at).localeCompare(String(b.visible_at || b.created_at)))
    .slice(0, limit);

  if (!candidates.length) return [];

  const claimedIds = new Set(candidates.map((j) => j.id));
  const claimedAt = now;
  const nextJobs = db.jobs.map((job) => {
    if (!claimedIds.has(job.id)) return job;
    // CAS: only claim if still claimable at write time.
    if (!isClaimable(job, now)) return job;
    return {
      ...job,
      status: "running" as const,
      claimed_at: claimedAt,
      claimed_by: workerId,
      attempts: (job.attempts ?? 0) + 1,
      updated_at: claimedAt,
      version: (job.version ?? 1) + 1,
    };
  });
  saveDatabase({ ...db, jobs: nextJobs });
  return nextJobs.filter((job) => claimedIds.has(job.id) && job.claimed_by === workerId && job.status === "running");
}

async function claimNextJobsPostgres(workerId: string, limit: number, now: string): Promise<DbJob[]> {
  const drizzleDb = getDrizzle();
  const rows = await drizzleDb.execute(sql`
    WITH due AS (
      SELECT id FROM jobs
      WHERE dead_lettered_at IS NULL
        AND kind NOT LIKE 'autonomy:%'
        AND COALESCE(visible_at, run_at, created_at) <= ${now}
        AND (
          status = 'queued'
          OR (
            status = 'running'
            AND claimed_at IS NOT NULL
            AND claimed_at <= ${new Date(Date.now() - VISIBILITY_TIMEOUT_MS).toISOString()}
          )
        )
      ORDER BY COALESCE(visible_at, run_at, created_at) ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    UPDATE jobs AS j
    SET
      status = 'running',
      claimed_at = ${now},
      claimed_by = ${workerId},
      attempts = COALESCE(j.attempts, 0) + 1,
      updated_at = ${now},
      version = COALESCE(j.version, 1) + 1
    FROM due
    WHERE j.id = due.id
    RETURNING j.*
  `);
  const list = (rows as unknown as { rows?: Record<string, unknown>[] }).rows || (rows as unknown as Record<string, unknown>[]);
  if (!Array.isArray(list)) return [];
  return list.map((j) => ({
    id: String(j.id),
    organization_id: String(j.organization_id),
    kind: String(j.kind),
    payload: (j.payload as Record<string, unknown>) || {},
    status: "running" as const,
    created_at: String(j.created_at),
    run_at: (j.run_at as string | null) ?? null,
    lane: String(j.lane || "default"),
    attempts: Number(j.attempts || 0),
    max_attempts: Number(j.max_attempts || DEFAULT_MAX_ATTEMPTS),
    visible_at: (j.visible_at as string | null) ?? null,
    claimed_at: (j.claimed_at as string | null) ?? null,
    claimed_by: (j.claimed_by as string | null) ?? null,
    last_error: (j.last_error as string | null) ?? null,
    updated_at: (j.updated_at as string | null) ?? null,
    idempotency_key: (j.idempotency_key as string | null) ?? null,
    dead_lettered_at: (j.dead_lettered_at as string | null) ?? null,
    version: Number(j.version || 1),
  }));
}

export function completeClaimedJob(jobId: string, workerId: string) {
  const db = database();
  const stamp = nowIso();
  saveDatabase({
    ...db,
    jobs: db.jobs.map((job) =>
      job.id === jobId && job.claimed_by === workerId
        ? {
            ...job,
            status: "done" as const,
            run_at: stamp,
            updated_at: stamp,
            claimed_at: null,
            claimed_by: null,
            version: (job.version ?? 1) + 1,
          }
        : job,
    ),
  });
}

export function failClaimedJob(jobId: string, workerId: string, error: string) {
  const db = database();
  const job = db.jobs.find((row) => row.id === jobId);
  if (!job || job.claimed_by !== workerId) return { deadLettered: false };
  const attempts = job.attempts ?? 1;
  const maxAttempts = job.max_attempts ?? DEFAULT_MAX_ATTEMPTS;
  const stamp = nowIso();

  if (attempts >= maxAttempts) {
    recordDeadLetter({
      jobId: job.id,
      kind: job.kind,
      organizationId: job.organization_id,
      error,
      attempts,
    });
    saveDatabase({
      ...database(),
      jobs: database().jobs.map((row) =>
        row.id === jobId
          ? {
              ...row,
              status: "failed" as const,
              last_error: error,
              dead_lettered_at: stamp,
              updated_at: stamp,
              claimed_at: null,
              claimed_by: null,
              run_at: stamp,
              version: (row.version ?? 1) + 1,
            }
          : row,
      ),
    });
    return { deadLettered: true };
  }

  const delay = RETRY_BASE_MS * Math.pow(2, Math.max(0, attempts - 1));
  const visibleAt = new Date(Date.now() + delay).toISOString();
  saveDatabase({
    ...db,
    jobs: db.jobs.map((row) =>
      row.id === jobId
        ? {
            ...row,
            status: "queued" as const,
            last_error: error,
            visible_at: visibleAt,
            updated_at: stamp,
            claimed_at: null,
            claimed_by: null,
            version: (row.version ?? 1) + 1,
          }
        : row,
    ),
  });
  return { deadLettered: false, retryAt: visibleAt };
}

/**
 * Drain autonomy + claim/execute known generic jobs for a single scheduler.
 * Unsupported kinds fail honestly (no fake side effects).
 */
export function processJobs(limit = 10) {
  const autonomy = processAutonomyQueue(limit);
  // When Redis is up, BullMQ owns generic jobs — this tick must not race it and
  // falsely mark an in-flight delivery failed.
  if (process.env.REDIS_URL?.trim()) return { generic: [], autonomy };
  if (typeof window === "undefined") {
    void import("@/lib/orchestrator").then((mod) => mod.tickDueOrchestratorRuns()).catch(() => undefined);
  }

  // When Redis/BullMQ is the worker, do not claim executable jobs here — one executor.
  // Still fail unsupported kinds honestly so they do not sit forever.
  const redisWorker = typeof window === "undefined" && Boolean(process.env.REDIS_URL?.trim());
  const workerId = `scheduler:${process.env.ATLAS_SCHEDULER_ID?.trim() || "primary"}`;
  const now = nowIso();
  const db = database();
  const executable = new Set([
    "send_message",
    "missed-call-follow-up",
    "waitlist-contact",
    "invoice-overdue-reminder",
  ]);
  const candidates = db.jobs
    .filter((job) => isClaimable(job, now))
    .sort((a, b) =>
      String(a.visible_at || a.created_at).localeCompare(String(b.visible_at || b.created_at)),
    )
    .slice(0, limit);

  if (!candidates.length) return { generic: [] as DbJob[], autonomy, claimed: 0 };

  const toClaim = redisWorker
    ? candidates.filter((job) => !executable.has(job.kind) && !job.kind.startsWith("orchestrator:"))
    : candidates;
  if (!toClaim.length) return { generic: [] as DbJob[], autonomy, claimed: 0 };

  const claimedIds = new Set(toClaim.map((j) => j.id));
  const claimedAt = now;
  const next = db.jobs.map((job) => {
    if (!claimedIds.has(job.id) || !isClaimable(job, now)) return job;
    return {
      ...job,
      status: "running" as const,
      claimed_at: claimedAt,
      claimed_by: workerId,
      attempts: (job.attempts ?? 0) + 1,
      updated_at: claimedAt,
      version: (job.version ?? 1) + 1,
    };
  });
  saveDatabase({ ...db, jobs: next });

  const claimed = next.filter((j) => claimedIds.has(j.id) && j.claimed_by === workerId);
  const unsupported: DbJob[] = [];
  const ran: DbJob[] = [];

  for (const job of claimed) {
    if (!executable.has(job.kind) && !job.kind.startsWith("orchestrator:")) {
      unsupported.push(job);
      // Unsupported kinds fail closed immediately — do not retry forever.
      const stamp = nowIso();
      recordDeadLetter({
        jobId: job.id,
        kind: job.kind,
        organizationId: job.organization_id,
        error: "No verified executor for this job kind.",
        attempts: job.attempts ?? 1,
      });
      const latest = database();
      saveDatabase({
        ...latest,
        jobs: latest.jobs.map((row) =>
          row.id === job.id
            ? {
                ...row,
                status: "failed" as const,
                last_error: "No verified executor for this job kind.",
                dead_lettered_at: stamp,
                updated_at: stamp,
                claimed_at: null,
                claimed_by: null,
                run_at: stamp,
                version: (row.version ?? 1) + 1,
              }
            : row,
        ),
      });
      continue;
    }
    ran.push(job);
    if (typeof window === "undefined") {
      enqueueAwaitedSideEffect(async () => {
        try {
          const { handleQueuedWork } = await import("@/lib/queue/handlers");
          await handleQueuedWork(job.kind, {
            jobId: job.id,
            organizationId: job.organization_id,
            userId: String(job.payload.userId || "atlas"),
            payload: job.payload,
            attemptsMade: job.attempts,
          });
          completeClaimedJob(job.id, workerId);
        } catch (error) {
          failClaimedJob(
            job.id,
            workerId,
            error instanceof Error ? error.message : "job handler failed",
          );
        }
      });
    } else {
      completeClaimedJob(job.id, workerId);
    }
  }

  if (unsupported.length) {
    const latest = database();
    saveDatabase({
      ...latest,
      notifications: [
        ...unsupported.map((job) => ({
          id: newId("note"),
          userId: String(job.payload.userId || ""),
          organizationId: job.organization_id,
          title: `Job ${job.kind} needs attention`,
          body: "No verified executor ran this queued job. No completion was recorded.",
          read: false,
          createdAt: nowIso(),
        })),
        ...latest.notifications,
      ],
    });
  }

  return { generic: ran, unsupported: unsupported.length, autonomy, claimed: claimed.length };
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
