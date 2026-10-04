import { getPostgresClient } from "@/lib/db/postgres";
import { nowIso, newId, awaitDatabaseWrites, applyServerDatabase } from "@/lib/db/store";
import { fromRow, defaultPolicy } from "@/lib/autonomy/defaults";
import { decideWork } from "@/lib/autonomy/engine";
import { maxAutonomyLevelForPlan, type AtlasPlan } from "@/lib/billing/entitlements";
import { createTaskSchema } from "@/lib/domain/schemas";
import type { DbAutonomyPolicy } from "@/lib/db/schema";

/** The claim, task, audit, and result commit together. A crash rolls back all four. */
export async function processDurableAutonomyQueue(limit = 20) {
  await awaitDatabaseWrites();
  const client = getPostgresClient();
  const result = await runDurableTaskBatch(client, limit);
  const { loadAtlasDatabaseFromPostgres } = await import("@/lib/db/postgres");
  const fresh = await loadAtlasDatabaseFromPostgres();
  if (fresh) applyServerDatabase(fresh);
  return result;
}

/** Also used by the isolated live PostgreSQL concurrency and rollback drill. */
export async function runDurableTaskBatch(client: ReturnType<typeof getPostgresClient>, limit = 20) {
  const outcomes: Array<{ id: string; status: "done" | "failed"; taskId?: string; error?: string }> = [];
  for (let i = 0; i < Math.min(Math.max(limit, 0), 100); i++) {
    const outcome = await client.begin(async (tx) => {
      const [job] = await tx`SELECT * FROM jobs WHERE status = 'queued'
        AND kind LIKE 'autonomy:%' ORDER BY created_at, id FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!job) return null;
      const stamp = nowIso();
      const userId = String(job.payload.userId || "");
      let taskId: string | undefined;
      let error: string | undefined;
      // Validation runs before any task insert. SQL errors abort the transaction
      // and leave the job queued rather than committing a partial result.
      let input: ReturnType<typeof createTaskSchema.parse> | undefined;
      try {
        if (job.kind !== "autonomy:assign_task") throw new Error("No verified executor for this action.");
        const [member] = await tx`SELECT role FROM organization_members WHERE organization_id = ${job.organization_id}
          AND user_id = ${userId} AND status = 'active' FOR SHARE`;
        if (!member || !["owner", "admin", "manager"].includes(member.role)) throw new Error("Requester is no longer an active manager.");
        const [stored] = await tx`SELECT * FROM autonomy_policies WHERE organization_id = ${job.organization_id} FOR SHARE`;
        const policy = stored ? fromRow(stored as DbAutonomyPolicy) : defaultPolicy(job.organization_id);
        const [sub] = await tx`SELECT plan FROM subscriptions WHERE org_id = ${job.organization_id} FOR SHARE`;
        const max = maxAutonomyLevelForPlan((sub?.plan || "free") as AtlasPlan);
        const verdict = decideWork({ kind: "assign_task", title: String(job.payload.title || "Task"), summary: "Create task" },
          { ...policy, level: Math.min(policy.level, max) as typeof policy.level });
        if (verdict.verdict !== "execute") throw new Error(verdict.reason);
        input = createTaskSchema.parse(job.payload);
        if (input.projectId) {
          const [project] = await tx`SELECT id FROM projects WHERE id = ${input.projectId} AND org_id = ${job.organization_id} FOR SHARE`;
          if (!project) throw new Error("Project not found in this business.");
        }
        if (input.assigneeId) {
          const [assignee] = await tx`SELECT id FROM organization_members WHERE user_id = ${input.assigneeId}
            AND organization_id = ${job.organization_id} AND status = 'active' FOR SHARE`;
          if (!assignee) throw new Error("Assignee is not active in this business.");
        }
      } catch (caught) { error = caught instanceof Error ? caught.message : "Invalid task."; }
      if (!error && input) {
        taskId = `task_auto_${job.id}`;
        await tx`INSERT INTO tasks (id, org_id, user_id, project_id, assignee_id, title, notes, status, priority,
          due_date, category, created_at, updated_at)
          VALUES (${taskId}, ${job.organization_id}, ${userId}, ${input.projectId || null}, ${input.assigneeId || null},
          ${input.title}, ${input.notes || ""}, 'todo', 'normal', ${input.dueDate || null}, 'General', ${stamp}, ${stamp})
          ON CONFLICT (id) DO NOTHING`;
      }
      const status = taskId ? "done" as const : "failed" as const;
      const payload = { ...job.payload, ...(taskId ? { resultTaskId: taskId } : { error }) };
      await tx`UPDATE jobs SET status = ${status}, payload = ${tx.json(payload)}, run_at = ${stamp},
        claimed_at = ${stamp}, claimed_by = 'atlas-task-worker', attempts = attempts + 1,
        updated_at = ${stamp}, last_error = ${error || null}, version = version + 1 WHERE id = ${job.id}`;
      await tx`INSERT INTO audit_logs (id, organization_id, actor_user_id, actor_label, action, entity_type, entity_id, created_at)
        VALUES (${newId("audit")}, ${job.organization_id}, ${userId}, 'Atlas Worker',
        ${taskId ? "autonomy:completed:assign_task" : "autonomy:failed:assign_task"}, 'job', ${job.id}, ${stamp})`;
      if (error) await tx`INSERT INTO notifications (id, user_id, organization_id, title, body, read, created_at)
        VALUES (${newId("note")}, ${userId}, ${job.organization_id}, 'Atlas automation needs attention', ${error}, false, ${stamp})`;
      return { id: String(job.id), status, ...(taskId ? { taskId } : { error }) };
    });
    if (!outcome) break;
    outcomes.push(outcome);
  }
  return { processed: outcomes.filter((row) => row.status === "done").length, jobs: outcomes };
}
