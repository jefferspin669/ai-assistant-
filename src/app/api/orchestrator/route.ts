import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { err, ok } from "@/lib/api/types";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { getRun, listRuns, orchestrate, tickRun } from "@/lib/orchestrator";
import { getTrace, listTraces } from "@/lib/orchestrator/store";
import { listCapabilities } from "@/lib/capabilities/registry";
import { evaluateRules } from "@/lib/rules/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await resolveSession(req);
    const url = new URL(req.url);
    const runId = url.searchParams.get("runId");
    const traceId = url.searchParams.get("traceId");
    if (runId) {
      const run = getRun(runId, ctx.organizationId);
      if (!run) return apiResponse(err("Run not found.", 404));
      return apiResponse(ok({ run, trace: getTrace(run.traceId, ctx.organizationId) }));
    }
    if (traceId) {
      const trace = getTrace(traceId, ctx.organizationId);
      if (!trace) return apiResponse(err("Trace not found.", 404));
      return apiResponse(ok({ trace }));
    }
    return apiResponse(
      ok({
        runs: listRuns(ctx.organizationId),
        traces: listTraces(ctx.organizationId),
        capabilities: listCapabilities(ctx),
        rules: evaluateRules({ organizationId: ctx.organizationId }),
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    rateLimit(`orchestrator:${clientKey(req)}`, 40, 60_000);
    const ctx = await resolveSession(req);
    const body = asRecord(await readJson(req));
    if (typeof body.runId === "string" && body.tick) {
      const run = getRun(body.runId, ctx.organizationId);
      if (!run) return apiResponse(err("Run not found.", 404));
      return apiResponse(ok({ run: await tickRun(run) }));
    }
    const goal = String(body.goal || body.message || "").trim();
    if (!goal) return apiResponse(err("goal is required", 422));
    const result = await orchestrate(ctx, goal, {
      waitHours: typeof body.waitHours === "number" ? body.waitHours : undefined,
    });
    return apiResponse(ok(result));
  } catch (error) {
    return jsonError(error);
  }
}
