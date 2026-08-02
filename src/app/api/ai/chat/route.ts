import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson } from "@/lib/api/http";

export async function POST(req: Request) {
  const body = await readJson(req);
  return apiResponse(atlasApi.ai.chat(String(body.message || body.text || "")));
}
