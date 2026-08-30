import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { ok } from "@/lib/api/types";

export async function GET(req: Request) {
  try {
    const ctx = resolveSession(req);
    return apiResponse(atlasApi.users.get(ctx.userId));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = resolveSession(req);
    const body = asRecord(await readJson(req));
    return apiResponse(
      atlasApi.users.update(ctx.userId, {
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
  } catch (error) {
    return jsonError(error);
  }
}
