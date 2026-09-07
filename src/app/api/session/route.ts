import { apiResponse, jsonError } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import {
  cookieHeader,
  mintDevSession,
  readCookie,
  sessionFromToken,
} from "@/lib/auth/session";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { isProduction } from "@/lib/ops/environment";
import { AuthenticationError } from "@/lib/domain/errors";

export async function GET(req: Request) {
  try {
    await ensureServerDatabase();
    try {
      const ctx = sessionFromToken(readCookie(req));
      return apiResponse(ok(ctx));
    } catch (error) {
      if (isProduction()) {
        return jsonError(new AuthenticationError("Sign in required."));
      }
      const minted = mintDevSession();
      return apiResponse(ok(minted.ctx), { "Set-Cookie": cookieHeader(minted.token) });
    }
  } catch (error) {
    return jsonError(error);
  }
}
