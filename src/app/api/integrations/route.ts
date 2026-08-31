import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import {
  listIntegrations,
  reconnectIntegration,
  refreshIntegrationTokens,
  setIntegrationStatus,
} from "@/lib/services/integrations";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";

export async function GET(req: Request) {
  try {
    const ctx = await resolveSession(req);
    return apiResponse(ok(listIntegrations(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    rateLimit(`integrations:${clientKey(req)}`, 30, 60_000);
    const ctx = await resolveSession(req);
    const body = asRecord(await readJson(req));
    const provider = String(body.provider || "");
    if (body.action === "reconnect") {
      return apiResponse(ok(await reconnectIntegration(ctx, provider)));
    }
    if (body.action === "refresh") {
      return apiResponse(ok(await refreshIntegrationTokens(ctx)));
    }
    const status =
      body.status === "connected" ||
      body.status === "expired" ||
      body.status === "error" ||
      body.status === "disconnected"
        ? body.status
        : "disconnected";
    return apiResponse(
      ok(
        setIntegrationStatus(
          ctx,
          provider,
          status,
          body.accountLabel != null ? String(body.accountLabel) : undefined,
        ),
      ),
    );
  } catch (error) {
    return jsonError(error);
  }
}
