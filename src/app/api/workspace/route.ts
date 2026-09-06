import { z } from "zod";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { ValidationError } from "@/lib/domain/errors";
import {
  WORKSPACE_DOMAINS,
  isWorkspaceDomain,
  loadWorkspace,
  putWorkspaceMany,
  workspaceStats,
  MAX_WORKSPACE_PAYLOAD_BYTES,
} from "@/lib/backend/workspace-store";
import { writeAudit } from "@/lib/services/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z.object({
  domains: z.record(z.unknown()).optional(),
});

export const GET = withPermission("workspace.read", async ({ workspace }) => {
  return apiSuccess({
    domains: WORKSPACE_DOMAINS,
    store: loadWorkspace(workspace.organizationId),
    stats: workspaceStats(workspace.organizationId),
  });
});

export const PUT = withPermission("workspace.write", async ({ workspace, body }) => {
  const parsed = parseBody(putSchema, body);
  const incoming = parsed.domains || {};
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (isWorkspaceDomain(key)) filtered[key] = value;
  }
  if (!Object.keys(filtered).length) {
    throw new ValidationError("No valid workspace domains provided.");
  }
  const encoded = JSON.stringify(filtered);
  if (encoded.length > MAX_WORKSPACE_PAYLOAD_BYTES) {
    throw new ValidationError(`Workspace payload exceeds ${MAX_WORKSPACE_PAYLOAD_BYTES} bytes.`);
  }
  const store = putWorkspaceMany(workspace.organizationId, filtered);
  writeAudit(workspace, {
    action: "workspace.put_many",
    entityType: "workspace",
    entityId: workspace.organizationId,
  });
  return apiSuccess(store);
});

export const POST = PUT;
