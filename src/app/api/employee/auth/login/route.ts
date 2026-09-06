import { z } from "zod";
import { apiResponse, parseBody, jsonError } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { cookieHeader } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { authenticateEmployeeLogin, ensureDemoEmployees } from "@/lib/services/employees";
import { database } from "@/lib/services/access";
import { atlasRuntimeEnv } from "@/lib/ops/environment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(200),
  accessCode: z.string().min(4).max(32),
  organizationId: z.string().max(80).optional(),
});

export async function POST(req: Request) {
  try {
    rateLimit(`employee-login:${clientKey(req)}`, 20, 60_000);
    await ensureServerDatabase();
    const body = parseBody(bodySchema, await req.json().catch(() => ({})));
    const result = authenticateEmployeeLogin({
      email: body.email,
      accessCode: body.accessCode,
      organizationId: body.organizationId,
    });
    return apiResponse(
      ok({
        employee: result.employee,
        sessionId: result.sessionId,
      }),
      { "Set-Cookie": cookieHeader(result.token) },
    );
  } catch (error) {
    return jsonError(error);
  }
}

/** Demo helper: list seeded demo accounts only outside production. */
export async function GET() {
  try {
    await ensureServerDatabase();
    if (atlasRuntimeEnv() === "production") {
      return apiResponse(ok({ demos: [] as unknown[], demoMode: false }));
    }
    const orgId = database().organizations[0]?.id;
    if (!orgId) return apiResponse(ok({ demos: [], demoMode: true }));
    const demos = ensureDemoEmployees(orgId);
    return apiResponse(ok({ demos, demoMode: true }));
  } catch (error) {
    return jsonError(error);
  }
}
