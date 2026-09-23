import { nowIso, saveDatabase } from "@/lib/db/store";
import { database } from "@/lib/services/access";
import { getPolicy } from "@/lib/autonomy/policy";

/**
 * Drain queued autonomy jobs honestly.
 * Until a verified executor exists for each kind, mark jobs failed instead of
 * claiming side effects completed. Kill switch still leaves jobs queued.
 */
export function processAutonomyQueue(limit = 20) {
  const db = database();
  const queued = db.jobs
    .filter((job) => job.status === "queued" && String(job.kind).startsWith("autonomy:"))
    .slice(0, limit);

  if (!queued.length) {
    return { processed: 0, skippedKillSwitch: 0, unsupported: 0, jobs: [] as typeof queued };
  }

  let skippedKillSwitch = 0;
  const failedIds = new Set<string>();

  for (const job of queued) {
    const policy = getPolicy(job.organization_id);
    if (policy.killSwitch) {
      skippedKillSwitch += 1;
      continue;
    }
    // No verified autonomy executor is wired for these kinds yet.
    failedIds.add(job.id);
  }

  saveDatabase({
    ...db,
    jobs: db.jobs.map((job) => {
      if (failedIds.has(job.id)) return { ...job, status: "failed" as const, run_at: nowIso() };
      return job;
    }),
  });

  return {
    processed: 0,
    skippedKillSwitch,
    unsupported: failedIds.size,
    jobs: queued.filter((j) => failedIds.has(j.id)),
  };
}
