import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { ingestWebhook } from "@/lib/services/integrations";
import { ValidationError } from "@/lib/domain/errors";

export async function POST(req: Request) {
  try {
    const ctx = resolveSession(req);
    const body = asRecord(await readJson(req));
    const eventId = String(req.headers.get("idempotency-key") || body.id || "").trim();
    if (!eventId) throw new ValidationError("Idempotency-Key is required.");
    return apiResponse(ok(ingestWebhook(ctx, eventId)));
  } catch (error) {
    return jsonError(error);
  }
}
