import { createCalendarEventSchema } from "@/lib/domain/schemas";
import { apiSuccess, parseBody, withPermission } from "@/lib/api/http";
import { createCustomerScopedEvent, createOrgEvent, listOrgEvents } from "@/lib/services/workspace";

export const GET = withPermission("calendar.read", async ({ workspace }) => {
  return apiSuccess(listOrgEvents(workspace));
});

export const POST = withPermission("calendar.write", async ({ workspace, body }) => {
  const parsed = parseBody(createCalendarEventSchema, body);
  if (parsed.customerId) {
    return apiSuccess(
      createCustomerScopedEvent(workspace, {
        customerId: parsed.customerId,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        title: parsed.title,
        assignee: parsed.assignee,
      }),
    );
  }
  return apiSuccess(createOrgEvent(workspace, parsed));
});
