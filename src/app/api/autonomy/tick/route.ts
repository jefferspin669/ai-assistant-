import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { err, ok } from "@/lib/api/types";
import { requirePermission } from "@/lib/auth/permissions";
import { processJobs } from "@/lib/services/jobs";
import type { SessionContext } from "@/lib/domain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Background tick for the autonomy queue.
 * Session (owner) or `Authorization: Bearer $CRON_SECRET`.
 * Vercel cron sends GET; operators may POST.
 */
function authorizeTick(req: Request): { via: "cron" } | { via: "session"; ctx: SessionContext } {
  const secret = (process.env.CRON_SECRET || "").trim();
  const header = req.headers.get("authorization") || "";
  if (secret && header === `Bearer ${secret}`) return { via: "cron" };
  const ctx = resolveSession(req);
  requirePermission(ctx, "atlas.autonomous");
  return { via: "session", ctx };
}

function runTick(req: Request) {
  try {
    const auth = authorizeTick(req);
    const processed = processJobs(20);
    return apiResponse(ok({ via: auth.via, processed }));
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
