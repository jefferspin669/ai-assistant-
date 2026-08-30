import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return apiResponse(atlasApi.files.delete(id));
}
