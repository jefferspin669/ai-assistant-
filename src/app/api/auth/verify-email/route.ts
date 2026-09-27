import { apiResponse, asRecord, jsonError, readJson } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { verifyEmail } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = asRecord(await readJson(req));
    verifyEmail(String(body.token || ""));
    return apiResponse(ok({ verified: true }));
  } catch (error) {
    return jsonError(error);
  }
}
