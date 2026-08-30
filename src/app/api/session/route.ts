import { apiResponse, jsonError } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import {
  cookieHeader,
  mintDevSession,
  readCookie,
  sessionFromToken,
} from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    try {
      const ctx = sessionFromToken(readCookie(req));
      return apiResponse(ok(ctx));
    } catch (error) {
      if (process.env.NODE_ENV === "production") throw error;
      const minted = mintDevSession();
      return apiResponse(ok(minted.ctx), { "Set-Cookie": cookieHeader(minted.token) });
    }
  } catch (error) {
    return jsonError(error);
  }
}
