import { apiResponse, jsonError, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";
import { database, requireOrgMember } from "@/lib/services/access";

export async function GET(req: Request) {
  try {
    const ctx = await resolveSession(req);
    const db = database();
    requireOrgMember(db, ctx);
    return apiResponse(
      ok(
        db.notifications.filter(
          (row) => row.userId === ctx.userId || row.organizationId === ctx.organizationId,
        ),
      ),
    );
  } catch (error) {
    return jsonError(error);
  }
}
