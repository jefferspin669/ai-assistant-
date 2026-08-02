import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson } from "@/lib/api/http";
import { err } from "@/lib/api/types";

export async function GET() {
  return apiResponse(atlasApi.tasks.list());
}

export async function POST(req: Request) {
  const body = await readJson(req);
  const users = atlasApi.users.list();
  const orgs = atlasApi.businesses.list();
  const userId = String(body.userId || body.user_id || (users.ok && users.data[0]?.id) || "");
  const orgId = String(body.orgId || body.organization_id || (orgs.ok && orgs.data[0]?.id) || "");
  if (!userId || !orgId) return apiResponse(err("user_id and organization_id are required.", 422));
  return apiResponse(
    atlasApi.tasks.create({
      orgId,
      userId,
      title: String(body.title || "Untitled task"),
      notes: String(body.notes || ""),
      status: (body.status as "todo" | "doing" | "done") || "todo",
      priority: (body.priority as "low" | "normal" | "high") || "normal",
      dueDate: body.dueDate != null ? String(body.dueDate) : body.due_date != null ? String(body.due_date) : null,
      category: String(body.category || "General"),
    }),
  );
}
