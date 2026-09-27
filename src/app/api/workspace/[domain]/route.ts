import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { NotFoundError, ValidationError } from "@/lib/domain/errors";
import {
  getWorkspaceDomain,
  getWorkspaceDomainAuthoritative,
  isWorkspaceDomain,
  putWorkspaceDomain,
  putWorkspaceDomainAuthoritative,
  MAX_WORKSPACE_PAYLOAD_BYTES,
} from "@/lib/backend/workspace-store";
import { writeAudit } from "@/lib/services/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ domain: string }> };

const putSchema = z.object({
  data: z.unknown(),
});

export async function GET(req: Request, ctx: Ctx) {
  const { domain } = await ctx.params;
  return withPermission("workspace.read", async ({ workspace }) => {
    if (!isWorkspaceDomain(domain)) {
      throw new NotFoundError(`Unknown workspace domain: ${domain}`);
    }
    return apiSuccess(await getWorkspaceDomainAuthoritative(workspace.organizationId, domain));
  })(req);
}

export async function PUT(req: Request, ctx: Ctx) {
  const { domain } = await ctx.params;
  return withPermission("workspace.write", async ({ workspace, body }) => {
    if (!isWorkspaceDomain(domain)) {
      throw new NotFoundError(`Unknown workspace domain: ${domain}`);
    }
    const parsed = parseBody(putSchema, body);
    if (!("data" in parsed)) {
      throw new ValidationError("Body must include { data }.");
    }
    const encoded = JSON.stringify(parsed.data ?? null);
    if (encoded.length > MAX_WORKSPACE_PAYLOAD_BYTES) {
      throw new ValidationError(`Workspace payload exceeds ${MAX_WORKSPACE_PAYLOAD_BYTES} bytes.`);
    }
    const result = await putWorkspaceDomainAuthoritative(workspace.organizationId, domain, parsed.data);
    writeAudit(workspace, {
      action: "workspace.put_domain",
      entityType: "workspace",
      entityId: domain,
    });
    return apiSuccess(result);
  })(req);
}

export async function POST(req: Request, ctx: Ctx) {
  return PUT(req, ctx);
}
