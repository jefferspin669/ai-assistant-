import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { getOrgProjects, putOrgProjects } from "@/lib/services/org-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z.object({
  projects: z.array(z.unknown()).default([]),
  folders: z.array(z.unknown()).default([]),
});

export const GET = withPermission("workspace.read", async ({ workspace }) => {
  return apiSuccess(getOrgProjects(workspace));
});

export const PUT = withPermission("workspace.write", async ({ workspace, body }) => {
  const parsed = parseBody(putSchema, body);
  return apiSuccess(
    putOrgProjects(workspace, {
      projects: parsed.projects as ReturnType<typeof getOrgProjects>["projects"],
      folders: parsed.folders as ReturnType<typeof getOrgProjects>["folders"],
    }),
  );
});

export const POST = PUT;
