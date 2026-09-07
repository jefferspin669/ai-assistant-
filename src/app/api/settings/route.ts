import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { getOrgSettings, putOrgSettings } from "@/lib/services/org-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  businessType: z.string().min(1).max(80).optional(),
  taxStructure: z.string().min(1).max(80).optional(),
  state: z.string().min(2).max(2).optional(),
  logoUrl: z.string().max(2000).nullable().optional(),
  timezone: z.string().min(1).max(80).optional(),
  preferredLanguage: z.string().min(1).max(16).optional(),
});

export const GET = withPermission("workspace.read", async ({ workspace }) => {
  return apiSuccess(getOrgSettings(workspace));
});

export const PUT = withPermission("workspace.write", async ({ workspace, body }) => {
  const parsed = parseBody(putSchema, body);
  return apiSuccess(putOrgSettings(workspace, parsed));
});

export const POST = PUT;
