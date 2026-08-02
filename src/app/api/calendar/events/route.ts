import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson } from "@/lib/api/http";
import { err } from "@/lib/api/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  return apiResponse(
    atlasApi.calendar.listEvents({
      user_id: url.searchParams.get("user_id") || undefined,
      organization_id: url.searchParams.get("organization_id") || undefined,
    }),
  );
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const users = atlasApi.users.list();
  const orgs = atlasApi.businesses.list();
  const userId = String(body.user_id || (users.ok && users.data[0]?.id) || "");
  const orgId = String(body.organization_id || (orgs.ok && orgs.data[0]?.id) || "");
  if (!userId || !orgId) return apiResponse(err("user_id and organization_id are required.", 422));
  return apiResponse(
    atlasApi.calendar.createEvent({
      user_id: userId,
      organization_id: orgId,
      title: String(body.title || ""),
      description: body.description != null ? String(body.description) : undefined,
      start_time: String(body.start_time || new Date().toISOString()),
      end_time: String(body.end_time || new Date(Date.now() + 3600000).toISOString()),
      timezone: body.timezone != null ? String(body.timezone) : undefined,
      category_id: body.category_id != null ? String(body.category_id) : undefined,
      location: body.location != null ? String(body.location) : undefined,
      priority: body.priority as "low" | "normal" | "high" | undefined,
      reminder_time: body.reminder_time != null ? String(body.reminder_time) : null,
      recurring_rule: body.recurring_rule != null ? String(body.recurring_rule) : null,
      external_calendar_id:
        body.external_calendar_id != null ? String(body.external_calendar_id) : null,
    }),
  );
}
