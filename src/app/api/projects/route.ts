import { createProjectSchema } from "@/lib/domain/schemas";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { createOrgProject, listOrgProjects } from "@/lib/services/workspace";

export const GET = withPermission("tasks.read", async ({ workspace }) => {
  return apiSuccess(listOrgProjects(workspace));
});

export const POST = withPermission("tasks.write", async ({ workspace, body }) => {
  return apiSuccess(createOrgProject(workspace, parseBody(createProjectSchema, body)));
});
