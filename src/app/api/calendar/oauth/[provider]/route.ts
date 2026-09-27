import { NextResponse } from "next/server";
import {
  calendarOAuthConfigured,
  createCalendarOAuthState,
  getAuthorizeUrl,
  type CalendarProvider,
} from "@/lib/integrations/calendar";
import { jsonError, resolveSession } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await ctx.params;
  const provider = raw as CalendarProvider;
  if (provider !== "google" && provider !== "microsoft") {
    return NextResponse.json({ ok: false, error: "Unknown provider" }, { status: 404 });
  }
  if (!calendarOAuthConfigured(provider)) {
    return NextResponse.json(
      {
        ok: false,
        error: `${provider} OAuth not configured`,
        hint: "Set client id/secret in env",
      },
      { status: 503 },
    );
  }
  try {
    const workspace = await resolveSession(req);
    const state = createCalendarOAuthState(workspace.organizationId);
    return NextResponse.redirect(getAuthorizeUrl(provider, state));
  } catch (error) {
    return jsonError(error);
  }
}
