import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { deleteOrgEvent, moveOrgEvent } from "@/lib/services/workspace";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await resolveSession(req);
    const body = asRecord(await readJson(req));
    return apiResponse(
      ok(
        moveOrgEvent(session, {
          eventId: id,
          startTime: String(body.startTime || body.start_time || ""),
          endTime: String(body.endTime || body.end_time || ""),
        }),
      ),
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await resolveSession(req);
    return apiResponse(ok(deleteOrgEvent(session, id)));
  } catch (error) {
    return jsonError(error);
  }
}
