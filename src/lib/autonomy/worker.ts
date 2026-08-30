import { nowIso, saveDatabase } from "@/lib/db/store";
import { database } from "@/lib/services/access";
import { getPolicy } from "@/lib/autonomy/policy";

/** Drain queued autonomy jobs. Real side effects still go through integrations when live. */
export function processAutonomyQueue(limit = 20) {
  const db = database();
  const queued = db.jobs
    .filter((job) => job.status === "queued" && String(job.kind).startsWith("autonomy:"))
    .slice(0, limit);

  if (!queued.length) {
    return { processed: 0, skippedKillSwitch: 0, jobs: [] as typeof queued };
  }

  let skippedKillSwitch = 0;
  const doneIds = new Set<string>();

  for (const job of queued) {
    const policy = getPolicy(job.organization_id);
    if (policy.killSwitch) {
      skippedKillSwitch += 1;
      continue;
    }
    doneIds.add(job.id);
  }

  saveDatabase({
    ...db,
    jobs: db.jobs.map((job) => {
      if (doneIds.has(job.id)) return { ...job, status: "done" as const, run_at: nowIso() };
      return job;
    }),
  });

  return { processed: doneIds.size, skippedKillSwitch, jobs: queued.filter((j) => doneIds.has(j.id)) };
}
