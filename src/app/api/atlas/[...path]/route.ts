import { NextRequest, NextResponse } from "next/server";
import { atlasApi } from "@/lib/api/atlas-api";

/**
 * HTTP façade over the Atlas Backend API mock.
 * Example: GET /api/atlas/meta/health
 *          POST /api/atlas/ai/chat { "message": "How is business?" }
 *
 * Note: this route runs on the server, so localStorage-backed db calls
 * re-seed an in-memory demo dataset per request. Client UI should prefer
 * `@/lib/api/atlas-api` directly for persistent browser state.
 */

type Ctx = { params: Promise<{ path: string[] }> };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const segments = path || [];
  const [domain, action] = segments;
  let body: Record<string, unknown> = {};
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  if (domain === "meta" && (action === "health" || !action)) {
    return json(atlasApi.meta.health());
  }
  if (domain === "meta" && action === "architecture") {
    return json(atlasApi.meta.architecture());
  }
  if (domain === "auth" && action === "signup" && req.method === "POST") {
    return json(
      atlasApi.auth.signup({
        email: String(body.email || ""),
        password: String(body.password || ""),
        name: String(body.name || ""),
        businessName: String(body.businessName || ""),
      }),
    );
  }
  if (domain === "auth" && action === "login" && req.method === "POST") {
    return json(atlasApi.auth.login(String(body.email || ""), String(body.password || "")));
  }
  if (domain === "users" && action && req.method === "POST") {
    return json(
      atlasApi.users.update(action, {
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
  if (domain === "users") return json(atlasApi.users.list());
  if (domain === "businesses" && action && req.method === "POST") {
    return json(
      atlasApi.businesses.update(action, {
        business_name: body.business_name != null ? String(body.business_name) : undefined,
        business_type: body.business_type != null ? String(body.business_type) : undefined,
        tax_structure: body.tax_structure != null ? String(body.tax_structure) : undefined,
        state: body.state != null ? String(body.state) : undefined,
        logo_url:
          body.logo_url === null
            ? null
            : body.logo_url != null
              ? String(body.logo_url)
              : undefined,
        owner_id: body.owner_id != null ? String(body.owner_id) : undefined,
      }),
    );
  }
  if (domain === "businesses" && req.method === "POST") {
    return json(
      atlasApi.businesses.create({
        owner_id: String(body.owner_id || ""),
        business_name: String(body.business_name || body.name || ""),
        business_type: body.business_type != null ? String(body.business_type) : undefined,
        tax_structure: body.tax_structure != null ? String(body.tax_structure) : undefined,
        state: body.state != null ? String(body.state) : undefined,
        logo_url: body.logo_url != null ? String(body.logo_url) : null,
      }),
    );
  }
  if (domain === "businesses") return json(atlasApi.businesses.list());
  if (domain === "organization-members" && action === "invite" && req.method === "POST") {
    return json(
      atlasApi.organizationMembers.invite({
        organization_id: String(body.organization_id || ""),
        user_id: body.user_id != null ? String(body.user_id) : undefined,
        email: body.email != null ? String(body.email) : undefined,
        full_name: body.full_name != null ? String(body.full_name) : undefined,
        role: body.role as "owner" | "admin" | "manager" | "employee" | "viewer" | undefined,
      }),
    );
  }
  if (domain === "organization-members" && action && req.method === "POST") {
    return json(
      atlasApi.organizationMembers.update(action, {
        role: body.role as "owner" | "admin" | "manager" | "employee" | "viewer" | undefined,
        status: body.status as "active" | "invited" | "suspended" | "removed" | undefined,
      }),
    );
  }
  if (domain === "organization-members") {
    const orgId = req.nextUrl.searchParams.get("organization_id") || undefined;
    return json(atlasApi.organizationMembers.list(orgId || undefined));
  }
  if (domain === "calendar") return json(atlasApi.calendar.listEvents());
  if (domain === "tasks") return json(atlasApi.tasks.list());
  if (domain === "transactions") return json(atlasApi.transactions.list());
  if (domain === "taxes" && action === "estimate") return json(atlasApi.taxes.estimate());
  if (domain === "taxes") return json(atlasApi.taxes.listRecords());
  if (domain === "ai" && action === "chat" && req.method === "POST") {
    return json(atlasApi.ai.chat(String(body.message || "")));
  }
  if (domain === "ai" && action === "conversations") return json(atlasApi.ai.listConversations());
  if (domain === "ai" && action === "memories") return json(atlasApi.ai.listMemories());
  if (domain === "notifications") return json(atlasApi.notifications.list());
  if (domain === "files") return json(atlasApi.files.list());
  if (domain === "billing") return json(atlasApi.billing.list());

  return json({ ok: false, error: `Unknown API path: /api/atlas/${segments.join("/")}`, status: 404 }, 404);
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx);
}
