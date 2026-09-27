import { NextResponse } from "next/server";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { pingPostgres, hasPostgres } from "@/lib/db/postgres";
import { pingRedis } from "@/lib/redis";
import { readWorkerHeartbeat } from "@/lib/queue/heartbeat";
import { listDeadLetters } from "@/lib/queue/dead-letter";
import { integrationStatus } from "@/lib/integrations/config";
import { buildBackendSecurityEvents } from "@/lib/security-center-server";
import { readCookie, sessionFromToken } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await ensureServerDatabase();
  const postgres = await pingPostgres();
  const redis = await pingRedis();
  const worker = await readWorkerHeartbeat();
  const deadLetters = listDeadLetters().length;
  const integrations = integrationStatus();

  const events = buildBackendSecurityEvents({
    postgres,
    redis,
    deadLetters,
    worker,
    integrations,
  });

  let organizationId: string | null = null;
  try {
    organizationId = sessionFromToken(readCookie(req)).organizationId;
  } catch {
    organizationId = null;
  }

  return NextResponse.json({
    ok: true,
    data: {
      events,
      organizationId,
      monitoring: "Atlas Security Center watches logins, API usage, exports, permissions, and integrations.",
      disclaimer:
        "Atlas cannot promise nothing will ever hurt the business. Goal: detection, containment, recovery, backups, and reducing damage.",
      backend: {
        postgresConfigured: hasPostgres(),
        postgresOk: postgres.ok,
        redisOk: redis.ok,
        deadLetters,
        workerAlive: worker.ok,
      },
    },
  });
}
