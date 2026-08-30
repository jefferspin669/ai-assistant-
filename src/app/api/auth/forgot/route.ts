import { apiResponse, asRecord, jsonError, readJson } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { createPasswordReset } from "@/lib/auth/session";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { database } from "@/lib/services/access";

export async function POST(req: Request) {
  try {
    rateLimit(`forgot:${clientKey(req)}`, 8);
    const body = asRecord(await readJson(req));
    const email = String(body.email || "").trim().toLowerCase();
    const user = database().users.find((row) => row.email === email);
    const token = user ? createPasswordReset(user.id) : null;
    return apiResponse(
      ok({
        sent: true,
        resetToken: process.env.NODE_ENV === "production" ? undefined : token,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
