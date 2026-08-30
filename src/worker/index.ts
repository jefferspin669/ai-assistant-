import { startAtlasWorker } from "../lib/queue/bullmq";
import { pingPostgres } from "../lib/db/postgres";
import { pingRedis } from "../lib/redis";

async function main() {
  const pg = await pingPostgres();
  const redis = await pingRedis();
  console.log("[atlas-worker] postgres", pg);
  console.log("[atlas-worker] redis", redis);
  const worker = startAtlasWorker();
  worker.on("completed", (job) => {
    console.log("[atlas-worker] completed", job.name, job.id);
  });
  worker.on("failed", (job, error) => {
    console.error("[atlas-worker] failed", job?.name, job?.id, error.message);
  });
  console.log("[atlas-worker] listening on atlas-jobs");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
