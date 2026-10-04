import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import postgres from "postgres";
import { readMigrationFiles } from "../src/lib/db/migrations";
import { runDurableTaskBatch } from "../src/lib/autonomy/durable-worker";

async function main() {
  const url = process.env.ATLAS_QUEUE_TEST_DATABASE_URL;
  if (!url) throw new Error("Set ATLAS_QUEUE_TEST_DATABASE_URL to a disposable PostgreSQL test database.");
  const namespace = `atlas_queue_test_${randomBytes(8).toString("hex")}`;
  const admin = postgres(url, { max: 1 });
  await admin`CREATE SCHEMA ${admin(namespace)}`;
  const client = postgres(url, { max: 5, connection: { search_path: namespace } });
  try {
    for (const file of readMigrationFiles()) await client.unsafe(file.sql);
    const stamp = new Date().toISOString();
    await client`INSERT INTO organization_members (id, organization_id, user_id, role, status, joined_at)
      VALUES ('member-a', 'org-a', 'owner-a', 'owner', 'active', ${stamp}),
      ('member-b', 'org-b', 'employee-b', 'employee', 'active', ${stamp})`;
    await client`INSERT INTO subscriptions (id, org_id, plan, status, renews_at, seats)
      VALUES ('sub-a', 'org-a', 'business', 'active', ${stamp}, 25)`;
    await client`INSERT INTO autonomy_policies (organization_id, level, control_mode, auto_permissions, kill_switch,
      auto_payment_limit_cents, refund_limit_cents, discount_cap_percent, marketing_budget_cents,
      earliest_schedule_hour, wake_only_emergencies, standing_orders, updated_at)
      VALUES ('org-a', 3, 'autonomous', '{"task_creation":true}', false, 500000, 10000, 10, 150000, 8, true, '[]', ${stamp})`;
    const enqueue = async (id: string, extra = {}) => client`INSERT INTO jobs (id, organization_id, kind, payload, status, created_at)
      VALUES (${id}, 'org-a', 'autonomy:assign_task', ${client.json({ userId: "owner-a", title: "Inspect roof", ...extra })}, 'queued', ${stamp})`;
    await enqueue("concurrent-job");
    const results = await Promise.all([runDurableTaskBatch(client), runDurableTaskBatch(client)]);
    assert.equal(results.reduce((sum, row) => sum + row.processed, 0), 1);
    assert.equal(Number((await client`SELECT count(*) AS n FROM tasks`)[0].n), 1);
    assert.equal((await client`SELECT status FROM jobs WHERE id = 'concurrent-job'`)[0].status, "done");
    await enqueue("crash-job");
    // Cause a SQL failure after task insertion: the entire transaction must roll back.
    await client`ALTER TABLE audit_logs RENAME TO audit_logs_temporarily_offline`;
    await assert.rejects(runDurableTaskBatch(client));
    await client`ALTER TABLE audit_logs_temporarily_offline RENAME TO audit_logs`;
    assert.equal((await client`SELECT status FROM jobs WHERE id = 'crash-job'`)[0].status, "queued");
    assert.equal(Number((await client`SELECT count(*) AS n FROM tasks WHERE id = 'task_auto_crash-job'`)[0].n), 0);
    assert.equal((await runDurableTaskBatch(client)).processed, 1);
    assert.equal((await runDurableTaskBatch(client)).processed, 0);
    await enqueue("foreign-assignee", { assigneeId: "employee-b" });
    assert.equal((await runDurableTaskBatch(client)).processed, 0);
    assert.equal((await client`SELECT status FROM jobs WHERE id = 'foreign-assignee'`)[0].status, "failed");
    await enqueue("paused-job");
    await client`UPDATE autonomy_policies SET kill_switch = true WHERE organization_id = 'org-a'`;
    assert.equal((await runDurableTaskBatch(client)).processed, 0);
    assert.equal((await client`SELECT status FROM jobs WHERE id = 'paused-job'`)[0].status, "failed");
    console.log("PASS: concurrent claims, rollback/retry, tenant assignment, emergency pause.");
  } finally {
    await client.end();
    // Only the uniquely named schema created by this drill is removed.
    await admin`DROP SCHEMA ${admin(namespace)} CASCADE`;
    await admin.end();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
