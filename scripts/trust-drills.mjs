#!/usr/bin/env node
/**
 * Trust drills that do not require Twilio/Stripe/calendar sandbox credentials.
 *
 * 1) Integration simulation — SMS/email/invoice adapters report simulation + audit
 * 2) JSON backup → mutate → restore round-trip
 * 3) Optional pg_dump → mutate → psql restore when DATABASE_URL is set
 *
 *   npm run drill:trust
 *   DATABASE_URL=... npm run drill:trust
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const databaseUrl = process.env.DATABASE_URL?.trim();
const tmpScript = resolve(root, ".data", "drill-sim.mts");

function runTsx(file) {
  const result = spawnSync("npx", ["tsx", file], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
  return result.stdout;
}

mkdirSync(resolve(root, ".data"), { recursive: true });

console.log("[drill:trust] 1) integration simulation");
writeFileSync(
  tmpScript,
  `
import { resetDatabase } from "../src/lib/db/store.ts";
import { database, testSession } from "../src/lib/services/access.ts";
import { sendSms } from "../src/lib/integrations/twilio.ts";
import { sendEmail } from "../src/lib/integrations/resend.ts";
import { sendCustomerSms, createAndSendInvoice } from "../src/lib/integrations/actions.ts";
import { listAudit } from "../src/lib/services/audit.ts";

async function main() {
  resetDatabase();
  const db = database();
  const ctx = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
  const sms = await sendSms({ to: "+15550001111", body: "drill", organizationId: ctx.organizationId });
  const email = await sendEmail({
    to: "drill@example.com",
    subject: "drill",
    text: "hi",
    organizationId: ctx.organizationId,
  });
  const staged = await sendCustomerSms(ctx, { to: "+15550001111", body: "needs approval" });
  const inv = await createAndSendInvoice(ctx, { customerName: "Drill Co", amountCents: 1200 });
  if (sms.mode !== "simulation" && sms.mode !== "live") throw new Error("sms mode unexpected " + sms.mode);
  if (!email.ok) throw new Error("email failed");
  if (staged.status !== "needs_approval") throw new Error("sms must stage without confirmationId");
  if (inv.status !== "needs_approval") throw new Error("invoice must stage without confirmationId");
  console.log(
    JSON.stringify({
      smsMode: sms.mode,
      emailSimulated: "simulated" in email ? email.simulated : false,
      staged: staged.status,
      invoice: inv.status,
      audit: listAudit(ctx.organizationId).length,
    }),
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
`,
  );
console.log(runTsx(tmpScript).trim());

console.log("[drill:trust] 2) JSON backup / restore");
const backupScript = resolve(root, ".data", "drill-backup.mts");
writeFileSync(
  backupScript,
  `
import { resetDatabase, loadDatabase, saveDatabase } from "../src/lib/db/store.ts";
import { backupJsonDatabase, restoreJsonDatabase } from "../src/lib/ops/backup.ts";

resetDatabase();
const before = loadDatabase().organizations.length;
const dest = backupJsonDatabase();
saveDatabase({ ...loadDatabase(), organizations: [] });
if (loadDatabase().organizations.length !== 0) throw new Error("mutate failed");
const restored = restoreJsonDatabase(dest);
if (restored.organizations.length !== before) throw new Error("restore org count mismatch");
console.log(JSON.stringify({ dest, orgs: restored.organizations.length }));
`,
);
console.log(runTsx(backupScript).trim());

if (databaseUrl) {
  console.log("[drill:trust] 3) Postgres dump / restore round-trip");
  const backupDir = resolve(root, ".data", "backups");
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dumpFile = resolve(backupDir, `drill-${stamp}.sql`);
  const dump = spawnSync(
    "pg_dump",
    [databaseUrl, "--clean", "--if-exists", "-f", dumpFile],
    { encoding: "utf8" },
  );
  if (dump.status !== 0) {
    console.error(dump.stderr || "pg_dump failed");
    process.exit(dump.status || 1);
  }
  const marker = spawnSync(
    "psql",
    [databaseUrl, "-c", "CREATE TABLE IF NOT EXISTS atlas_drill_marker(id int); INSERT INTO atlas_drill_marker VALUES (1);"],
    { encoding: "utf8" },
  );
  if (marker.status !== 0) {
    console.error(marker.stderr);
    process.exit(1);
  }
  const restore = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", dumpFile], {
    encoding: "utf8",
  });
  if (restore.status !== 0) {
    console.error(restore.stderr || restore.stdout);
    process.exit(restore.status || 1);
  }
  if (!existsSync(dumpFile) || readFileSync(dumpFile, "utf8").length < 100) {
    console.error("dump file too small");
    process.exit(1);
  }
  console.log(JSON.stringify({ dumpFile, bytes: readFileSync(dumpFile).length, restore: "ok" }));
} else {
  console.log("[drill:trust] 3) SKIP pg round-trip (DATABASE_URL unset)");
}

try {
  unlinkSync(tmpScript);
  unlinkSync(backupScript);
} catch {
  /* ignore */
}

console.log("[drill:trust] PASS");
