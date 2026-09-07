import { apiSuccess, withPermission } from "@/lib/api/http";
import { ValidationError } from "@/lib/domain/errors";
import { createExternalEvent, getConnectedProviders } from "@/lib/integrations/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withPermission("calendar.read", async ({ workspace }) => {
  return apiSuccess({ connected: getConnectedProviders(workspace.organizationId) });
});

export const POST = withPermission("calendar.write", async ({ workspace, body }) => {
  const title = String(body.title || "");
  const startsAt = String(body.startsAt || body.start || "");
  const endsAt = String(body.endsAt || body.end || "");
  if (!title || !startsAt || !endsAt) {
    throw new ValidationError("title, startsAt, endsAt required");
  }
  const result = await createExternalEvent({
    title,
    startsAt,
    endsAt,
    description: body.description ? String(body.description) : undefined,
    provider: body.provider === "microsoft" || body.provider === "google" ? body.provider : undefined,
    organizationId: workspace.organizationId,
  });
  return apiSuccess(result);
});
