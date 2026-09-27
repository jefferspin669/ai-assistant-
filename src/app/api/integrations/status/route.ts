import { withAuth, apiSuccess } from "@/lib/api/http";
import { integrationStatus } from "@/lib/integrations/config";
import { getConnectedProviders } from "@/lib/integrations/calendar";
import { listMissedCalls } from "@/lib/integrations/twilio";
import { atlasStore } from "@/lib/integrations/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async ({ workspace }) => {
  return apiSuccess({
    storeMode: atlasStore.mode(),
    integrations: integrationStatus(),
    calendarsConnected: getConnectedProviders(workspace.organizationId),
    missedCalls: listMissedCalls(workspace.organizationId).slice(0, 10),
    organizationId: workspace.organizationId,
  });
});
