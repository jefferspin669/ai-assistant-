import { apiResponse, asRecord, jsonError, readJson } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { authenticate, cookieHeader } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { ensureServerDatabase } from "@/lib/db/ensure";
import {
  provisionAtlasUserFromSupabase,
  signInWithSupabase,
  supabaseAuthConfigured,
} from "@/lib/auth/supabase-auth";

export async function POST(req: Request) {
  try {
    rateLimit(`login:${clientKey(req)}`, 10);
    await ensureServerDatabase();
    const body = asRecord(await readJson(req));
    const email = String(body.email || "");
    const password = String(body.password || "");

    if (supabaseAuthConfigured()) {
      const supabase = await signInWithSupabase(email, password);
      if (supabase?.user) {
        const provisioned = await provisionAtlasUserFromSupabase(supabase.user);
        return apiResponse(
          ok({
            userId: provisioned.ctx.userId,
            organizationId: provisioned.ctx.organizationId,
            role: provisioned.ctx.role,
            sessionId: provisioned.ctx.sessionId,
            auth: "supabase",
          }),
          { "Set-Cookie": cookieHeader(provisioned.token) },
        );
      }
    }

    const result = authenticate(email, password, clientKey(req));
    return apiResponse(
      ok({
        userId: result.user.id,
        organizationId: result.organizationId,
        role: result.role,
        sessionId: result.sessionId,
        full_name: result.user.full_name,
        mfaRequired: result.mfaRequired,
        auth: "atlas",
      }),
      { "Set-Cookie": cookieHeader(result.token) },
    );
  } catch (error) {
    return jsonError(error);
  }
}
