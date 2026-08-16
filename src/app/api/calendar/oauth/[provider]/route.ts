import { NextResponse } from "next/server";
import {
  calendarOAuthConfigured,
  getAuthorizeUrl,
  type CalendarProvider,
} from "@/lib/integrations/calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
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
  const state = crypto.randomUUID();
  const url = getAuthorizeUrl(provider, state);
  return NextResponse.redirect(url);
}
