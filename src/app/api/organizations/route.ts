import { apiSuccess, withAuth, parseBody } from "@/lib/api/http";
import { cookieHeader, listMemberships, switchOrganization } from "@/lib/auth/session";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ workspace }) => {
  return apiSuccess({
    currentOrganizationId: workspace.organizationId,
    memberships: listMemberships(workspace.userId),
  });
});

const switchSchema = z.object({
  organizationId: z.string().min(1).max(80),
});

export const POST = withAuth(async ({ workspace, body }) => {
  const { organizationId } = parseBody(switchSchema, body);
  const switched = switchOrganization(workspace, organizationId);
  return apiSuccess(
    {
      organizationId: switched.ctx.organizationId,
      role: switched.ctx.role,
      sessionId: switched.sessionId,
      memberships: listMemberships(workspace.userId),
    },
    { "Set-Cookie": cookieHeader(switched.token) },
  );
});
