import { fileExists } from "@/lib/db/file-persist";
import { hasPostgres } from "@/lib/db/postgres";
import { listDeadLetters } from "@/lib/queue/dead-letter";
import { readWorkerHeartbeat } from "@/lib/queue/heartbeat";
import { queueDriver } from "@/lib/queue/env";
import { atlasRuntimeEnv, isProduction } from "@/lib/ops/environment";
import { redisConfigured } from "@/lib/redis";
import { publicEnvReport } from "@/lib/secrets/redact";

export type ReliabilitySnapshot = {
  environment: ReturnType<typeof atlasRuntimeEnv>;
  production: boolean;
  postgresConfigured: boolean;
  redisConfigured: boolean;
  queueDriver: ReturnType<typeof queueDriver>;
  worker: Awaited<ReturnType<typeof readWorkerHeartbeat>>;
  deadLetters: number;
  orgDeadLetters: number;
  backupArtifacts: {
    atlasDb: boolean;
    workspace: boolean;
  };
  secrets: ReturnType<typeof publicEnvReport>;
  readyForTraffic: boolean;
  alerts: string[];
};

/** Operational readiness signals for Phase 6 reliability / DR. */
export async function reliabilitySnapshot(organizationId?: string): Promise<ReliabilitySnapshot> {
  const worker = await readWorkerHeartbeat();
  const deadLetters = listDeadLetters().length;
  const orgDeadLetters = organizationId ? listDeadLetters(organizationId).length : 0;
  const secrets = publicEnvReport();
  const alerts: string[] = [];

  if (worker.stale) alerts.push("Worker heartbeat is stale or missing.");
  if (deadLetters > 0) alerts.push(`${deadLetters} job(s) in the dead-letter queue.`);
  if (isProduction() && !hasPostgres()) alerts.push("Production without DATABASE_URL.");
  if (isProduction() && !redisConfigured()) alerts.push("Production without REDIS_URL.");
  if (secrets.leaked?.length) alerts.push("Public env report flagged possible secret leaks.");

  const readyForTraffic =
    alerts.length === 0 || (!isProduction() && !worker.stale && deadLetters < 25);

  return {
    environment: atlasRuntimeEnv(),
    production: isProduction(),
    postgresConfigured: hasPostgres(),
    redisConfigured: redisConfigured(),
    queueDriver: queueDriver(),
    worker,
    deadLetters,
    orgDeadLetters,
    backupArtifacts: {
      atlasDb: fileExists("atlas-db.json"),
      workspace: fileExists("workspace.json"),
    },
    secrets,
    readyForTraffic,
    alerts,
  };
}
