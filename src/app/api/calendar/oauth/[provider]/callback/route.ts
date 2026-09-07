import { NextResponse } from "next/server";
import {
  consumeCalendarOAuthState,
  exchangeCode,
  type CalendarProvider,
} from "@/lib/integrations/calendar";
import { getAppUrl } from "@/lib/integrations/config";
import { resolveSession } from "@/lib/api/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const { provider: raw } = await ctx.params;
  const provider = raw as CalendarProvider;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const err = url.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(`${getAppUrl()}/app/commercial?calendar=error&reason=${err}`);
  }
  if (!code || !state || (provider !== "google" && provider !== "microsoft")) {
    return NextResponse.redirect(`${getAppUrl()}/app/commercial?calendar=missing_code`);
  }
  try {
    const workspace = await resolveSession(req);
    const stateOrganization = consumeCalendarOAuthState(state);
    if (!stateOrganization || stateOrganization !== workspace.organizationId) {
      throw new Error("OAuth state is invalid or expired.");
    }
    await exchangeCode(provider, code, workspace.organizationId);
    return NextResponse.redirect(`${getAppUrl()}/app/commercial?calendar=${provider}_connected`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "oauth_failed";
    return NextResponse.redirect(
      `${getAppUrl()}/app/commercial?calendar=error&reason=${encodeURIComponent(msg)}`,
    );
  }
}
