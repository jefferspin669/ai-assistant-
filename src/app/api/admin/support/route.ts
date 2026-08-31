import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { supportSnapshot } from "@/lib/privacy/account";
import { listDeadLetters } from "@/lib/queue/dead-letter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await resolveSession(req);
    const snapshot = supportSnapshot(ctx);
    return apiResponse(
      ok({
        ...snapshot,
        deadLetters: listDeadLetters(ctx.organizationId).slice(0, 20),
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
