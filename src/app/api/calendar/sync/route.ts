import { apiResponse, readJson } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import { createExternalEvent, getConnectedProviders } from "@/lib/integrations/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return apiResponse(ok({ connected: getConnectedProviders() }));
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const title = String(body.title || "");
  const startsAt = String(body.startsAt || body.start || "");
  const endsAt = String(body.endsAt || body.end || "");
  if (!title || !startsAt || !endsAt) {
    return apiResponse(err("title, startsAt, endsAt required", 422));
  }
  try {
    const result = await createExternalEvent({
      title,
      startsAt,
      endsAt,
      description: body.description ? String(body.description) : undefined,
      provider: body.provider === "microsoft" || body.provider === "google" ? body.provider : undefined,
    });
    return apiResponse(ok(result));
  } catch (error) {
    return apiResponse(err(error instanceof Error ? error.message : "calendar sync failed", 502));
  }
}
