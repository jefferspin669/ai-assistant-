import { apiResponse, readJson } from "@/lib/api/http";
import { ok, err } from "@/lib/api/types";
import {
  getWorkspaceDomain,
  isWorkspaceDomain,
  putWorkspaceDomain,
} from "@/lib/backend/workspace-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ domain: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { domain } = await ctx.params;
  if (!isWorkspaceDomain(domain)) {
    return apiResponse(err(`Unknown workspace domain: ${domain}`, 404));
  }
  return apiResponse(ok(getWorkspaceDomain(domain)));
}

export async function PUT(req: Request, ctx: Ctx) {
  const { domain } = await ctx.params;
  if (!isWorkspaceDomain(domain)) {
    return apiResponse(err(`Unknown workspace domain: ${domain}`, 404));
  }
  const body = await readJson<{ data?: unknown }>(req);
  if (!("data" in body)) {
    return apiResponse(err("Body must include { data }.", 422));
  }
  return apiResponse(ok(putWorkspaceDomain(domain, body.data)));
}

export async function POST(req: Request, ctx: Ctx) {
  return PUT(req, ctx);
}
