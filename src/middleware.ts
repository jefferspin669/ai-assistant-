import { NextRequest, NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";

const APP_USER = process.env.ATLAS_APP_USER?.trim() || "atlas";
const APP_PASSWORD = process.env.ATLAS_APP_PASSWORD?.trim() || "";
const IS_DEV = process.env.NODE_ENV !== "production";

/** Timing-safe string compare (Edge-compatible; no Node crypto). */
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

function parseBasicAuth(
  header: string | null,
): { user: string; pass: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    const colon = decoded.indexOf(":");
    if (colon < 0) return null;
    return {
      user: decoded.slice(0, colon),
      pass: decoded.slice(colon + 1),
    };
  } catch {
    return null;
  }
}

function checkBasicAuth(request: NextRequest): boolean {
  const creds = parseBasicAuth(request.headers.get("authorization"));
  if (!creds) return false;
  return safeEqual(creds.user, APP_USER) && safeEqual(creds.pass, APP_PASSWORD);
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  applySecurityHeaders(response.headers, {
    isDev: IS_DEV,
    includeHsts: !IS_DEV,
  });
  response.headers.delete("x-powered-by");
  return response;
}

function unauthorized(): NextResponse {
  const response = new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Atlas AI", charset="UTF-8"',
      "Cache-Control": "no-store",
    },
  });
  return withSecurityHeaders(response);
}

function locked(): NextResponse {
  const response = new NextResponse(
    "Atlas app is locked. Set ATLAS_APP_PASSWORD before starting in production.",
    {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
  return withSecurityHeaders(response);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectingApp = pathname === "/app" || pathname.startsWith("/app/");

  if (protectingApp) {
    // Production without a password: refuse rather than leave the dashboard open.
    if (!APP_PASSWORD && !IS_DEV) {
      return locked();
    }
    if (APP_PASSWORD && !checkBasicAuth(request)) {
      return unauthorized();
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
