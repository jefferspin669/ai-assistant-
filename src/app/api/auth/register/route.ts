import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, asRecord, jsonError, readJson } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { cookieHeader, createEmailVerification, createSession } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { enqueueJob } from "@/lib/services/jobs";
import { testSession } from "@/lib/services/access";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { signUpWithSupabase, supabaseAuthConfigured } from "@/lib/auth/supabase-auth";

export async function POST(req: Request) {
  try {
    rateLimit(`register:${clientKey(req)}`, 8);
    await ensureServerDatabase();
    const body = asRecord(await readJson(req));
    const email = String(body.email || "");
    const password = String(body.password || "");
    const result = atlasApi.auth.signup({
      email,
      password,
      name: String(body.name || body.full_name || ""),
      businessName: String(body.business_name || body.businessName || "My Business"),
    });
    if (!result.success) return apiResponse(result);
    if (supabaseAuthConfigured()) {
      await signUpWithSupabase(email, password);
    }
    const session = createSession(result.data.userId, result.data.orgId);
    createEmailVerification(result.data.userId);
    enqueueJob(testSession(result.data.userId, result.data.orgId), "verify_email", {
      userId: result.data.userId,
    });
    return apiResponse(ok({ ...result.data, sessionId: session.sessionId }), {
      "Set-Cookie": cookieHeader(session.token),
    });
  } catch (error) {
    return jsonError(error);
  }
}
