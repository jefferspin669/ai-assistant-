import { NextRequest, NextResponse } from "next/server";
import { atlasApi } from "@/lib/api/atlas-api";
import { ensureServerDatabase } from "@/lib/db/ensure";
import { resolveSession, jsonError } from "@/lib/api/http";
import { AuthenticationError, AuthorizationError } from "@/lib/domain/errors";
import { hasPermission } from "@/lib/auth/permissions";
import type { SessionContext } from "@/lib/domain/types";
import { isProduction } from "@/lib/ops/environment";

/**
 * Legacy HTTP façade over atlas-api.
 * Sensitive domains require an authenticated session; body userId / organizationId
 * are ignored — identity comes only from the atlas_session cookie.
 *
 * Prefer dedicated routes (`/api/settings`, `/api/organizations`, `/api/memory`, …)
 * for new work. This catch-all exists for older clients.
 */

type Ctx = { params: Promise<{ path: string[] }> };

const PUBLIC_AUTH_ACTIONS = new Set(["signup", "login"]);

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function stripIdentity(body: Record<string, unknown>) {
  const next = { ...body };
  delete next.userId;
  delete next.user_id;
  delete next.organizationId;
  delete next.organization_id;
  delete next.owner_id;
  return next;
}

function requireSessionRole(session: SessionContext, roles: SessionContext["role"][]) {
  if (!roles.includes(session.role)) {
    throw new AuthorizationError("Insufficient role for this Atlas API path.");
  }
}

async function handle(req: NextRequest, ctx: Ctx) {
  await ensureServerDatabase();
  const { path } = await ctx.params;
  const segments = path || [];
  const [domain, action] = segments;
  let body: Record<string, unknown> = {};
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = stripIdentity((await req.json()) as Record<string, unknown>);
    } catch {
      body = {};
    }
  }

  const isPublicAuth =
    domain === "auth" && action && PUBLIC_AUTH_ACTIONS.has(action) && req.method === "POST";
  const isPublicMeta = domain === "meta";

  let session: SessionContext | null = null;
  try {
    session = await resolveSession(req);
  } catch {
    if (!isPublicAuth && !isPublicMeta) {
      if (isProduction()) {
        throw new AuthenticationError("Sign in required for /api/atlas/*.");
      }
      // Dev demos: still refuse mutating/listing business data without a cookie.
      if (!isPublicAuth && !isPublicMeta) {
        throw new AuthenticationError("Sign in required for /api/atlas/*.");
      }
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

  if (!session) {
    throw new AuthenticationError("Sign in required for /api/atlas/*.");
  }

  if (domain === "users" && action && req.method === "POST") {
    if (action !== session.userId && session.role !== "owner" && session.role !== "admin") {
      throw new AuthorizationError("You can only update your own profile.");
    }
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
  if (domain === "users") {
    requireSessionRole(session, ["owner", "admin"]);
    return json(atlasApi.users.list());
  }

  if (domain === "businesses" && action && req.method === "POST") {
    if (action !== session.organizationId) {
      throw new AuthorizationError("Cannot mutate another organization's business record.");
    }
    if (!hasPermission(session, "workspace.write")) {
      throw new AuthorizationError("Missing permission: workspace.write");
    }
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
      }),
    );
  }
  if (domain === "businesses" && req.method === "POST") {
    requireSessionRole(session, ["owner", "admin"]);
    return json(
      atlasApi.businesses.create({
        owner_id: session.userId,
        business_name: String(body.business_name || body.name || ""),
        business_type: body.business_type != null ? String(body.business_type) : undefined,
        tax_structure: body.tax_structure != null ? String(body.tax_structure) : undefined,
        state: body.state != null ? String(body.state) : undefined,
        logo_url: body.logo_url != null ? String(body.logo_url) : null,
      }),
    );
  }
  if (domain === "businesses") {
    const all = atlasApi.businesses.list();
    if (!all.success) return json(all);
    return json({
      ...all,
      data: all.data.filter((org) => org.id === session.organizationId),
    });
  }

  if (domain === "organization-members" && action === "invite" && req.method === "POST") {
    if (!hasPermission(session, "employees.manage")) {
      throw new AuthorizationError("Missing permission: employees.manage");
    }
    return json(
      atlasApi.organizationMembers.invite({
        organization_id: session.organizationId,
        user_id: body.user_id != null ? String(body.user_id) : undefined,
        email: body.email != null ? String(body.email) : undefined,
        full_name: body.full_name != null ? String(body.full_name) : undefined,
        role: body.role as "owner" | "admin" | "manager" | "employee" | "viewer" | undefined,
      }),
    );
  }
  if (domain === "organization-members" && action && req.method === "POST") {
    if (!hasPermission(session, "employees.manage")) {
      throw new AuthorizationError("Missing permission: employees.manage");
    }
    return json(
      atlasApi.organizationMembers.update(action, {
        role: body.role as "owner" | "admin" | "manager" | "employee" | "viewer" | undefined,
        status: body.status as "active" | "invited" | "suspended" | "removed" | undefined,
      }),
    );
  }
  if (domain === "organization-members") {
    return json(atlasApi.organizationMembers.list(session.organizationId));
  }

  if (domain === "calendar-categories" || domain === "calendar") {
    if (!hasPermission(session, "calendar.read") && req.method === "GET") {
      throw new AuthorizationError("Missing permission: calendar.read");
    }
    if (req.method === "POST" && !hasPermission(session, "calendar.write")) {
      throw new AuthorizationError("Missing permission: calendar.write");
    }
  }

  if (domain === "calendar-categories" && action && req.method === "POST") {
    return json(
      atlasApi.calendar.updateCategory(action, {
        name: body.name != null ? String(body.name) : undefined,
        color: body.color != null ? String(body.color) : undefined,
        icon: body.icon != null ? String(body.icon) : undefined,
      }),
    );
  }
  if (domain === "calendar-categories" && req.method === "POST") {
    return json(
      atlasApi.calendar.createCategory({
        user_id: session.userId,
        organization_id: session.organizationId,
        name: String(body.name || ""),
        color: body.color != null ? String(body.color) : undefined,
        icon: body.icon != null ? String(body.icon) : undefined,
        id: body.id != null ? String(body.id) : undefined,
      }),
    );
  }
  if (domain === "calendar-categories") {
    return json(
      atlasApi.calendar.listCategories({
        user_id: session.userId,
        organization_id: session.organizationId,
      }),
    );
  }
  if (domain === "calendar" && action && req.method === "POST") {
    return json(
      atlasApi.calendar.update(action, {
        title: body.title != null ? String(body.title) : undefined,
        description: body.description != null ? String(body.description) : undefined,
        start_time: body.start_time != null ? String(body.start_time) : undefined,
        end_time: body.end_time != null ? String(body.end_time) : undefined,
        timezone: body.timezone != null ? String(body.timezone) : undefined,
        category_id: body.category_id != null ? String(body.category_id) : undefined,
        location: body.location != null ? String(body.location) : undefined,
        priority: body.priority as "low" | "normal" | "high" | undefined,
        reminder_time:
          body.reminder_time === null
            ? null
            : body.reminder_time != null
              ? String(body.reminder_time)
              : undefined,
        recurring_rule:
          body.recurring_rule === null
            ? null
            : body.recurring_rule != null
              ? String(body.recurring_rule)
              : undefined,
        external_calendar_id:
          body.external_calendar_id === null
            ? null
            : body.external_calendar_id != null
              ? String(body.external_calendar_id)
              : undefined,
      }),
    );
  }
  if (domain === "calendar" && req.method === "POST") {
    return json(
      atlasApi.calendar.createEvent({
        user_id: session.userId,
        organization_id: session.organizationId,
        title: String(body.title || ""),
        description: body.description != null ? String(body.description) : undefined,
        start_time: String(body.start_time || new Date().toISOString()),
        end_time: String(body.end_time || new Date(Date.now() + 3600000).toISOString()),
        timezone: body.timezone != null ? String(body.timezone) : undefined,
        category_id: body.category_id != null ? String(body.category_id) : undefined,
        location: body.location != null ? String(body.location) : undefined,
        priority: body.priority as "low" | "normal" | "high" | undefined,
        reminder_time: body.reminder_time != null ? String(body.reminder_time) : null,
        recurring_rule: body.recurring_rule != null ? String(body.recurring_rule) : null,
        external_calendar_id:
          body.external_calendar_id != null ? String(body.external_calendar_id) : null,
      }),
    );
  }
  if (domain === "calendar") {
    return json(
      atlasApi.calendar.listEvents({
        user_id: session.userId,
        organization_id: session.organizationId,
      }),
    );
  }

  if (domain === "tasks") {
    if (!hasPermission(session, "tasks.read")) {
      throw new AuthorizationError("Missing permission: tasks.read");
    }
    const listed = atlasApi.tasks.list();
    if (!listed.success) return json(listed);
    return json({
      ...listed,
      data: listed.data.filter((t) => t.orgId === session.organizationId),
    });
  }
  if (domain === "transactions") {
    if (!hasPermission(session, "payments.read")) {
      throw new AuthorizationError("Missing permission: payments.read");
    }
    const listed = atlasApi.transactions.list();
    if (!listed.success) return json(listed);
    return json({
      ...listed,
      data: listed.data.filter((t) => t.orgId === session.organizationId),
    });
  }
  if (domain === "taxes" && action === "estimate") {
    if (!hasPermission(session, "payments.read")) {
      throw new AuthorizationError("Missing permission: payments.read");
    }
    return json(atlasApi.taxes.estimate());
  }
  if (domain === "taxes") {
    if (!hasPermission(session, "payments.read")) {
      throw new AuthorizationError("Missing permission: payments.read");
    }
    return json(atlasApi.taxes.listRecords());
  }
  if (domain === "ai" && action === "chat" && req.method === "POST") {
    return json(atlasApi.ai.chat(String(body.message || "")));
  }
  if (domain === "ai" && action === "conversations") return json(atlasApi.ai.listConversations());
  if (domain === "ai" && action === "memories") return json(atlasApi.ai.listMemories());
  if (domain === "notifications") return json(atlasApi.notifications.list());
  if (domain === "files") {
    requireSessionRole(session, ["owner", "admin", "manager"]);
    return json(atlasApi.files.list());
  }
  if (domain === "billing") {
    requireSessionRole(session, ["owner", "admin"]);
    return json(atlasApi.billing.list());
  }

  return json({ ok: false, error: `Unknown API path: /api/atlas/${segments.join("/")}`, status: 404 }, 404);
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    return await handle(req, ctx);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    return await handle(req, ctx);
  } catch (error) {
    return jsonError(error);
  }
}
