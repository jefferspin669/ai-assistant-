import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson } from "@/lib/api/http";
import { err } from "@/lib/api/types";

export async function POST(req: Request) {
  const body = await readJson(req);
  const users = atlasApi.users.list();
  const orgs = atlasApi.businesses.list();
  const userId = String(body.userId || body.user_id || (users.ok && users.data[0]?.id) || "");
  const orgId = String(body.orgId || body.organization_id || (orgs.ok && orgs.data[0]?.id) || "");
  if (!userId || !orgId) return apiResponse(err("user_id and organization_id are required.", 422));
  const title = String(body.title || body.name || "Upload");
  const content = String(body.content || body.data || "");
  if (!content) return apiResponse(err("content is required for this demo upload.", 422));
  return apiResponse(
    atlasApi.files.upload({
      userId,
      orgId,
      title,
      content,
      kind: (body.kind as "file" | "document" | "conversation" | "template") || "file",
    }),
  );
}
