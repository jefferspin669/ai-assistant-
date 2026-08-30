import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { executeAtlasAction } from "@/lib/domain/actions";

export async function POST(req: Request) {
  try {
    const ctx = resolveSession(req);
    const body = asRecord(await readJson(req));
    const action = body.action ?? body;
    return apiResponse(ok(executeAtlasAction(action, ctx)));
  } catch (error) {
    return jsonError(error);
  }
}
