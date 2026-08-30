import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { listIntegrations, setIntegrationStatus } from "@/lib/services/integrations";

export async function GET(req: Request) {
  try {
    const ctx = resolveSession(req);
    return apiResponse(ok(listIntegrations(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = resolveSession(req);
    const body = asRecord(await readJson(req));
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
          String(body.provider || ""),
          status,
          body.accountLabel != null ? String(body.accountLabel) : undefined,
        ),
      ),
    );
  } catch (error) {
    return jsonError(error);
  }
}
