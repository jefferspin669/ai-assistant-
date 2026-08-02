import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse } from "@/lib/api/http";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return apiResponse(atlasApi.ai.deleteConversation(id));
}
