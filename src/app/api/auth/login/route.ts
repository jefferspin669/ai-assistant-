import { apiResponse, asRecord, jsonError, readJson } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { authenticate, cookieHeader } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  try {
    rateLimit(`login:${clientKey(req)}`, 10);
    const body = asRecord(await readJson(req));
    const result = authenticate(String(body.email || ""), String(body.password || ""), clientKey(req));
    return apiResponse(
      ok({
        userId: result.user.id,
        organizationId: result.organizationId,
        role: result.role,
        sessionId: result.sessionId,
        full_name: result.user.full_name,
        mfaRequired: result.mfaRequired,
      }),
      { "Set-Cookie": cookieHeader(result.token) },
    );
  } catch (error) {
    return jsonError(error);
  }
}
