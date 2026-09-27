import { createTaskSchema } from "@/lib/domain/schemas";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { createOrgTask, listOrgTasks } from "@/lib/services/workspace";

export const GET = withPermission("tasks.read", async ({ workspace }) => {
  return apiSuccess(listOrgTasks(workspace));
});

export const POST = withPermission("tasks.write", async ({ workspace, body }) => {
  return apiSuccess(createOrgTask(workspace, parseBody(createTaskSchema, body)));
});
