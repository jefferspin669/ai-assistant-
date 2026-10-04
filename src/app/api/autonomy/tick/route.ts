import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { err, ok } from "@/lib/api/types";
import { requirePermission } from "@/lib/auth/permissions";
import { processServerJobs } from "@/lib/services/jobs";
import { awaitDatabaseWrites } from "@/lib/db/store";
import type { SessionContext } from "@/lib/domain/types";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { awaitDatabaseWrites } from "@/lib/db/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Background tick for the autonomy queue.
 * Session (owner) or `Authorization: Bearer $CRON_SECRET`.
 * Vercel cron sends GET; operators may POST.
 */
async function authorizeTick(
  req: Request,
): Promise<{ via: "cron" } | { via: "session"; ctx: SessionContext }> {
  const secret = (process.env.CRON_SECRET || "").trim();
  const header = req.headers.get("authorization") || "";
  if (secret && header === `Bearer ${secret}`) {
    await ensureServerDatabase();
    return { via: "cron" };
  }
  const ctx = await resolveSession(req);
  requirePermission(ctx, "atlas.autonomous");
  return { via: "session", ctx };
}

async function runTick(req: Request) {
  try {
    const auth = await authorizeTick(req);
    const processed = await processServerJobs(20);
    const orch = await import("@/lib/orchestrator").then((mod) => mod.tickDueOrchestratorRuns());
    await awaitDatabaseWrites();
    return apiResponse(ok({ via: auth.via, processed, orchestrator: orch.map((run) => run.id) }));
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(req: Request) {
  if (!(process.env.CRON_SECRET || "").trim() && !req.headers.get("cookie")) {
    return apiResponse(err("Set CRON_SECRET or sign in to tick the autonomy queue.", 401));
  }
  return runTick(req);
}

export async function POST(req: Request) {
  return runTick(req);
}
