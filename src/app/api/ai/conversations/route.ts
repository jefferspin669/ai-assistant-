import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse } from "@/lib/api/http";

export async function GET() {
  return apiResponse(atlasApi.ai.listConversations());
}
