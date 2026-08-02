import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await readJson(req);
  return apiResponse(
    atlasApi.calendar.update(id, {
      title: body.title != null ? String(body.title) : undefined,
      description: body.description != null ? String(body.description) : undefined,
      start_time: body.start_time != null ? String(body.start_time) : undefined,
      end_time: body.end_time != null ? String(body.end_time) : undefined,
      timezone: body.timezone != null ? String(body.timezone) : undefined,
      category_id: body.category_id != null ? String(body.category_id) : undefined,
      location: body.location != null ? String(body.location) : undefined,
      priority: body.priority as "low" | "normal" | "high" | undefined,
      reminder_time:
        body.reminder_time === null
          ? null
          : body.reminder_time != null
            ? String(body.reminder_time)
            : undefined,
      recurring_rule:
        body.recurring_rule === null
          ? null
          : body.recurring_rule != null
            ? String(body.recurring_rule)
            : undefined,
      external_calendar_id:
        body.external_calendar_id === null
          ? null
          : body.external_calendar_id != null
            ? String(body.external_calendar_id)
            : undefined,
    }),
  );
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return apiResponse(atlasApi.calendar.deleteEvent(id));
}
