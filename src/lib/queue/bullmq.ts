import { Queue, Worker, type Job } from "bullmq";
import { getRedis, redisConfigured } from "@/lib/redis";
import { handleQueuedWork } from "@/lib/queue/handlers";

const QUEUE_NAME = "atlas-jobs";

let queue: Queue | null = null;

export function getAtlasQueue() {
  const conn = getRedis();
  if (!conn) return null;
  if (!queue) queue = new Queue(QUEUE_NAME, { connection: conn });
  return queue;
}

export async function addBullJob(
  name: string,
  data: { jobId: string; organizationId: string; userId: string; payload: Record<string, unknown> },
) {
  const q = getAtlasQueue();
  if (!q) return null;
  return q.add(name, data, {
    jobId: data.jobId,
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 200,
    removeOnFail: 200,
  });
}

export function startAtlasWorker() {
  const conn = getRedis();
  if (!conn || !redisConfigured()) {
    throw new Error("REDIS_URL is required to start the Atlas worker");
  }
  const workerId = `bullmq:${process.env.ATLAS_SCHEDULER_ID?.trim() || "primary"}`;
  return new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const jobId = String(job.data.jobId || job.id);
      const { loadDatabase, saveDatabase, nowIso } = await import("@/lib/db/store");
      const { completeClaimedJob, failClaimedJob } = await import("@/lib/services/jobs");
      // Take the durable row lease so Redis workers and the scheduler cannot double-run.
      const stamp = nowIso();
      const db = loadDatabase();
      const row = db.jobs.find((item) => item.id === jobId);
      if (row && (row.status === "queued" || row.status === "running")) {
        saveDatabase({
          ...db,
          jobs: db.jobs.map((item) =>
            item.id === jobId
              ? {
                  ...item,
                  status: "running" as const,
                  claimed_at: stamp,
                  claimed_by: workerId,
                  attempts: Math.max(item.attempts ?? 0, job.attemptsMade || 0) + (item.status === "queued" ? 1 : 0),
                  updated_at: stamp,
                  version: (item.version ?? 1) + 1,
                }
              : item,
          ),
        });
      }
      try {
        await handleQueuedWork(job.name, {
          jobId,
          organizationId: String(job.data.organizationId || ""),
          userId: String(job.data.userId || "atlas"),
          payload: (job.data.payload || {}) as Record<string, unknown>,
          attemptsMade: job.attemptsMade,
        });
        completeClaimedJob(jobId, workerId);
      } catch (error) {
        failClaimedJob(
          jobId,
          workerId,
          error instanceof Error ? error.message : "bullmq worker failed",
        );
        throw error;
      }
    },
    { connection: conn, concurrency: 4 },
  );
}
