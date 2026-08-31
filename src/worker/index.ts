import { startAtlasWorker } from "../lib/queue/bullmq";
import { pingPostgres } from "../lib/db/postgres";
import { pingRedis } from "../lib/redis";
import { ensureServerDatabase } from "../lib/db/ensure";
import { recordDeadLetter } from "../lib/queue/dead-letter";
import { touchWorkerHeartbeat } from "../lib/queue/heartbeat";

async function main() {
  const ensure = await ensureServerDatabase();
  const pg = await pingPostgres();
  const redis = await pingRedis();
  console.log("[atlas-worker] database", ensure);
  console.log("[atlas-worker] postgres", pg);
  console.log("[atlas-worker] redis", redis);
  await touchWorkerHeartbeat();
  const beat = setInterval(() => {
    void touchWorkerHeartbeat();
  }, 30_000);
  if (typeof beat.unref === "function") beat.unref();
  const worker = startAtlasWorker();
  worker.on("completed", (job) => {
    console.log("[atlas-worker] completed", job.name, job.id);
  });
  worker.on("failed", (job, error) => {
    console.error("[atlas-worker] failed", job?.name, job?.id, error.message);
    const attempts = job?.opts.attempts || 3;
    if (job && job.attemptsMade >= attempts) {
      recordDeadLetter({
        jobId: String(job.id),
        kind: job.name,
        organizationId: String(job.data?.organizationId || ""),
        error: error.message,
        attempts: job.attemptsMade,
      });
    }
  });
  console.log("[atlas-worker] listening on atlas-jobs");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
