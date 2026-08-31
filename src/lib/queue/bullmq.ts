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
  return new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      await handleQueuedWork(job.name, {
        jobId: String(job.data.jobId || job.id),
        organizationId: String(job.data.organizationId || ""),
        userId: String(job.data.userId || "atlas"),
        payload: (job.data.payload || {}) as Record<string, unknown>,
        attemptsMade: job.attemptsMade,
      });
    },
    { connection: conn, concurrency: 4 },
  );
}
