import { createCalendarEventSchema } from "@/lib/domain/schemas";
import { apiResponse, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { createCustomerScopedEvent, createOrgEvent, listOrgEvents } from "@/lib/services/workspace";

export async function GET(req: Request) {
  try {
    const ctx = await resolveSession(req);
    return apiResponse(ok(listOrgEvents(ctx)));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await resolveSession(req);
    const parsed = createCalendarEventSchema.parse(await readJson(req));
    if (parsed.customerId) {
      return apiResponse(
        ok(
          createCustomerScopedEvent(ctx, {
            customerId: parsed.customerId,
            startTime: parsed.startTime,
            endTime: parsed.endTime,
            title: parsed.title,
            assignee: parsed.assignee,
          }),
        ),
      );
    }
    return apiResponse(ok(createOrgEvent(ctx, parsed)));
  } catch (error) {
    return jsonError(error);
  }
}
