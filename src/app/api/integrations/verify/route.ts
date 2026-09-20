import { z } from "zod";
import { apiSuccess, parseBody, withAuth } from "@/lib/api/http";
import { AuthorizationError } from "@/lib/domain/errors";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { VERIFIABLE_INTEGRATIONS, verifyIntegration } from "@/lib/integrations/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const integration = z.enum([
  "brain",
  "stripe",
  "twilio",
  "google_calendar",
  "microsoft_calendar",
  "resend",
]);

const bodySchema = z.object({
  integrations: z.array(integration).min(1).max(6),
  dryRun: z.boolean().optional(),
});

export const POST = withAuth(async ({ req, workspace, body }) => {
  rateLimit(`integrations-verify:${clientKey(req)}`, 12, 60_000);
  if (workspace.role !== "owner" && workspace.role !== "admin") {
    throw new AuthorizationError("Only owners and admins can verify integration credentials.");
  }
  const input = parseBody(bodySchema, body);
  const results = await Promise.all(
    input.integrations.map((id) =>
      verifyIntegration(id, workspace.organizationId, { dryRun: input.dryRun }),
    ),
  );
  return apiSuccess({
    ok: results.every((result) => result.ok),
    results,
    catalog: VERIFIABLE_INTEGRATIONS,
  });
});
