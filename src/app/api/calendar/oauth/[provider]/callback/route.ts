import { NextResponse } from "next/server";
import { exchangeCode, type CalendarProvider } from "@/lib/integrations/calendar";
import { getAppUrl } from "@/lib/integrations/config";

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
  const err = url.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(`${getAppUrl()}/app/commercial?calendar=error&reason=${err}`);
  }
  if (!code || (provider !== "google" && provider !== "microsoft")) {
    return NextResponse.redirect(`${getAppUrl()}/app/commercial?calendar=missing_code`);
  }
  try {
    await exchangeCode(provider, code);
    return NextResponse.redirect(`${getAppUrl()}/app/commercial?calendar=${provider}_connected`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "oauth_failed";
    return NextResponse.redirect(
      `${getAppUrl()}/app/commercial?calendar=error&reason=${encodeURIComponent(msg)}`,
    );
  }
}
