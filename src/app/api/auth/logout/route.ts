import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { clearCookieHeader, revokeAllSessions, revokeSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const ctx = await resolveSession(req);
    revokeSession(ctx.sessionId);
    return apiResponse(ok({ loggedOut: true }), { "Set-Cookie": clearCookieHeader() });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const ctx = await resolveSession(req);
    revokeAllSessions(ctx.userId);
    return apiResponse(ok({ loggedOutAll: true }), { "Set-Cookie": clearCookieHeader() });
  } catch (error) {
    return jsonError(error);
  }
}
