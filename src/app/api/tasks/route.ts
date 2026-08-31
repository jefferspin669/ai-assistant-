import { createTaskSchema } from "@/lib/domain/schemas";
import { apiResponse, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { createOrgTask, listOrgTasks } from "@/lib/services/workspace";

export async function GET(req: Request) {
  try {
    const ctx = await resolveSession(req);
    return apiResponse(ok(listOrgTasks(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await resolveSession(req);
    const parsed = createTaskSchema.parse(await readJson(req));
    return apiResponse(ok(createOrgTask(ctx, parsed)));
  } catch (error) {
    return jsonError(error);
  }
}
