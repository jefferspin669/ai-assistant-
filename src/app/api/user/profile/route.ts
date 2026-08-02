import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson, resolveUserId } from "@/lib/api/http";
import { err } from "@/lib/api/types";

export async function GET(req: Request) {
  const userId = resolveUserId(req);
  if (userId) return apiResponse(atlasApi.users.get(userId));
  const listed = atlasApi.users.list();
  if (!listed.ok) return apiResponse(listed);
  if (!listed.data[0]) return apiResponse(err("No user profile found.", 404));
  return apiResponse({ ok: true, data: listed.data[0] });
}

export async function PATCH(req: Request) {
  const body = await readJson(req);
  const userId = resolveUserId(req, body.user_id != null ? String(body.user_id) : undefined);
  const listed = atlasApi.users.list();
  const fallbackId = listed.ok ? listed.data[0]?.id : "";
  const id = userId || fallbackId;
  if (!id) return apiResponse(err("User not found.", 404));
  return apiResponse(
    atlasApi.users.update(id, {
      full_name: body.full_name != null ? String(body.full_name) : undefined,
      email: body.email != null ? String(body.email) : undefined,
      timezone: body.timezone != null ? String(body.timezone) : undefined,
      preferred_language:
        body.preferred_language != null ? String(body.preferred_language) : undefined,
      profile_image:
        body.profile_image === null
          ? null
          : body.profile_image != null
            ? String(body.profile_image)
            : undefined,
    }),
  );
}
