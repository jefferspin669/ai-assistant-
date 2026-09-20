import {
  acceptInviteSchema,
  createProjectSchema,
  inviteWorkerSchema,
} from "@/lib/domain/schemas";
import { apiSuccess, parseBody, withWorkspace } from "@/lib/api/http";
import {
  acceptWorkerInvite,
  completeTaskAsAssignee,
  inviteWorker,
  teamOpsSnapshot,
} from "@/lib/services/team-ops";
import { createOrgProject, listOrgProjects } from "@/lib/services/workspace";
import { ValidationError } from "@/lib/domain/errors";

export const GET = withWorkspace(async ({ workspace, req }) => {
  const url = new URL(req.url);
  const view = url.searchParams.get("view");
  if (view === "projects") return apiSuccess(listOrgProjects(workspace));
  return apiSuccess(teamOpsSnapshot(workspace));
});

export const POST = withWorkspace(async ({ workspace, body }) => {
  const action = String(body.action || "");
  if (action === "invite") {
    return apiSuccess(inviteWorker(workspace, parseBody(inviteWorkerSchema, body)));
  }
  if (action === "accept") {
    return apiSuccess(acceptWorkerInvite(workspace, parseBody(acceptInviteSchema, body)));
  }
  if (action === "create_project") {
    return apiSuccess(createOrgProject(workspace, parseBody(createProjectSchema, body)));
  }
  if (action === "complete_task") {
    const taskId = String(body.taskId || "");
    if (!taskId) throw new ValidationError("taskId is required.");
    return apiSuccess(completeTaskAsAssignee(workspace, taskId));
  }
  throw new ValidationError("Unknown team-ops action.");
});
