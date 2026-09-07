import { z } from "zod";
import { apiResponse, jsonError, parseBody } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { cookieHeader } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { acceptOrganizationInvite, peekInvite } from "@/lib/services/invitations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const acceptSchema = z.object({
  token: z.string().min(16).max(128),
  password: z.string().min(8).max(200),
  fullName: z.string().min(1).max(120),
});

export async function GET(req: Request) {
  try {
    await ensureServerDatabase();
    const token = new URL(req.url).searchParams.get("token") || "";
    return apiResponse(ok(peekInvite(token)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    rateLimit(`invite-accept:${clientKey(req)}`, 20, 60_000);
    await ensureServerDatabase();
    const body = parseBody(acceptSchema, await req.json().catch(() => ({})));
    const result = acceptOrganizationInvite(body);
    return apiResponse(ok({
      userId: result.userId,
      organizationId: result.organizationId,
      role: result.role,
      sessionId: result.sessionId,
    }), { "Set-Cookie": cookieHeader(result.token) });
  } catch (error) {
    return jsonError(error);
  }
}
