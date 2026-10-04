import { nowIso, saveDatabase } from "@/lib/db/store";
import { database, requireOrgMember } from "@/lib/services/access";
import { getPolicy } from "@/lib/autonomy/policy";
import { decideWork } from "@/lib/autonomy/engine";
import { createOrgTask } from "@/lib/services/workspace";
import { writeAudit } from "@/lib/services/audit";
import { notify } from "@/lib/services/jobs";
import { createTaskSchema } from "@/lib/domain/schemas";
import { maxAutonomyLevelForPlan, subscriptionForOrg } from "@/lib/billing/entitlements";
import type { SessionContext } from "@/lib/domain/types";

/**
 * Only assign_task has a verified, persisted autonomy executor today.
 * Every queued action is re-authorized immediately before execution.
 */
export function processAutonomyQueue(limit = 20) {
  if (process.env.DATABASE_URL?.trim()) throw new Error("PostgreSQL tasks must use the durable server worker.");
  const queued = database().jobs
    .filter((job) => job.status === "queued" && job.kind.startsWith("autonomy:"))
    .slice(0, limit);
  let processed = 0;
  let unsupported = 0;
  let skippedKillSwitch = 0;
  const jobs: Array<{ id: string; status: "done" | "failed"; taskId?: string; error?: string }> = [];

  for (const job of queued) {
    const current = database().jobs.find((row) => row.id === job.id && row.organization_id === job.organization_id);
    if (!current || current.status !== "queued") continue;
    const userId = String(current.payload.userId || "");
    const ctx: SessionContext = {
      userId, organizationId: current.organization_id, role: "owner", sessionId: "worker",
    };
    let taskId: string | undefined;
    let error: string | undefined;
    try {
      if (current.kind !== "autonomy:assign_task") {
        unsupported += 1;
        throw new Error("No verified executor is connected for this action.");
      }
      const db = database();
      const member = requireOrgMember(db, ctx);
      if (!["owner", "admin", "manager"].includes(member.role)) {
        throw new Error("The requesting user can no longer assign tasks.");
      }
      ctx.role = member.role;
      const stored = getPolicy(ctx.organizationId);
      const max = maxAutonomyLevelForPlan(subscriptionForOrg(ctx.organizationId)?.plan || "free");
      const policy = stored.level > max ? { ...stored, level: max } : stored;
      const verdict = decideWork({
        kind: "assign_task", title: String(current.payload.title || "Task"),
        summary: "Create an assigned task",
      }, policy);
      if (verdict.verdict !== "execute") {
        if (stored.killSwitch) skippedKillSwitch += 1;
        throw new Error(verdict.reason);
      }
      const input = createTaskSchema.parse({
        title: current.payload.title,
        notes: current.payload.notes,
        projectId: current.payload.projectId,
        assigneeId: current.payload.assigneeId,
        dueDate: current.payload.dueDate,
      });
      const task = createOrgTask(ctx, input);
      taskId = task.id;
      processed += 1;
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "Autonomous task failed.";
    }

    const latest = database();
    saveDatabase({
      ...latest,
      jobs: latest.jobs.map((row) => row.id === job.id && row.organization_id === job.organization_id
        ? { ...row, status: taskId ? "done" as const : "failed" as const,
          run_at: nowIso(), payload: { ...row.payload, ...(taskId ? { resultTaskId: taskId } : { error }) } }
        : row),
    });
    writeAudit(ctx, {
      action: taskId ? "autonomy:completed:assign_task" : `autonomy:failed:${current.kind}`,
      entityType: "job", entityId: job.id, actorLabel: "Atlas Worker",
    });
    if (error) notify(ctx, "Atlas automation needs attention", error);
    jobs.push({ id: job.id, status: taskId ? "done" : "failed", ...(taskId ? { taskId } : { error }) });
  }

  return { processed, unsupported, skippedKillSwitch, jobs };
}
