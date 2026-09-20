import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { createOrganizationInvite } from "@/lib/services/invitations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().email().max(200),
  role: z.enum(["admin", "manager", "employee", "accountant", "viewer"]).optional(),
  fullName: z.string().max(120).optional(),
});

export const POST = withPermission("employees.manage", async ({ workspace, body }) => {
  const parsed = parseBody(bodySchema, body);
  const result = await createOrganizationInvite(workspace, parsed);
  return apiSuccess(result);
});
