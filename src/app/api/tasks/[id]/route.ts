import { updateTaskSchema } from "@/lib/domain/schemas";
import { apiResponse, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { deleteOrgTask, updateOrgTask } from "@/lib/services/workspace";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await resolveSession(req);
    const parsed = updateTaskSchema.parse(await readJson(req));
    return apiResponse(ok(updateOrgTask(session, id, parsed)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const session = await resolveSession(req);
    return apiResponse(ok(deleteOrgTask(session, id)));
  } catch (error) {
    return jsonError(error);
  }
}
