import { atlasApi } from "@/lib/api/atlas-api";
import { apiResponse, readJson } from "@/lib/api/http";

export async function POST(req: Request) {
  const body = await readJson(req);
  return apiResponse(
    atlasApi.auth.signup({
      email: String(body.email || ""),
      password: String(body.password || ""),
      name: String(body.name || body.full_name || ""),
      businessName: String(body.business_name || body.businessName || "My Business"),
    }),
  );
}
