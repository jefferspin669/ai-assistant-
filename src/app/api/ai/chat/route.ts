import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, asRecord, readJson } from "@/lib/api/http";

export async function POST(req: Request) {
  const body = asRecord(await readJson(req));
  return apiResponse(atlasApi.ai.chat(String(body.message || body.text || "")));
}
