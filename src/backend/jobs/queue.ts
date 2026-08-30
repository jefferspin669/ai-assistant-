import { enqueueJob, processJobs } from "@/lib/services/jobs";
import type { SessionContext } from "@/lib/domain/types";

/**
 * Job queue contract. File-backed today (processJobs / cron).
 * Swap the body of addJob() to BullMQ in Phase 3 — same call sites.
 */
export function addJob(
  ctx: Pick<SessionContext, "userId" | "organizationId">,
  name: string,
  payload: Record<string, unknown>,
) {
  return enqueueJob(
    {
      userId: ctx.userId,
      organizationId: ctx.organizationId,
      role: "owner",
      sessionId: "queue",
    },
    name,
    { ...payload, userId: ctx.userId },
  );
}

export function drainQueue(limit = 20) {
  return processJobs(limit);
}

export function queueDriver(): "file" | "bullmq" {
  // Phase 3: when REDIS_URL is set, swap addJob() to BullMQ. Until then the
  // file queue in `.data/atlas-db.json` is what actually runs.
  void process.env.REDIS_URL;
  return "file";
}
