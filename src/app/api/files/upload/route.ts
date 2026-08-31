import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, asRecord, jsonError, readJson, resolveSession } from "@/lib/api/http";
import { err } from "@/lib/api/types";
import { emitEvent } from "@/lib/events/bus";
import { uploadObject } from "@/lib/storage/object-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ctx = await resolveSession(req);
    const body = asRecord(await readJson(req));
    const title = String(body.title || body.name || "Upload");
    const content = String(body.content || body.data || "");
    if (!content) return apiResponse(err("content is required.", 422));
    const kind = body.kind;
    const result = atlasApi.files.upload({
      userId: ctx.userId,
      orgId: ctx.organizationId,
      title,
      content,
      kind:
        kind === "file" || kind === "document" || kind === "conversation" || kind === "template"
          ? kind
          : "file",
      fileName: body.fileName != null ? String(body.fileName) : null,
      mimeType: body.mimeType != null ? String(body.mimeType) : null,
      sizeBytes: typeof body.sizeBytes === "number" ? body.sizeBytes : null,
    });
    if (result.ok) {
      emitEvent({
        type: "file.uploaded",
        organizationId: ctx.organizationId,
        actorId: ctx.userId,
        payload: { id: result.data.id, title: result.data.title, kind: result.data.kind },
      });
      void uploadObject({
        path: `${ctx.organizationId}/${result.data.id}`,
        body: content,
        contentType: result.data.mimeType || "text/plain",
      }).catch(() => undefined);
    }
    return apiResponse(result);
  } catch (error) {
    return jsonError(error);
  }
}
