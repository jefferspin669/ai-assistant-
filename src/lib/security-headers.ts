/** Shared runtime security headers for middleware and next.config. */
export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "off",
  "Permissions-Policy":
    "camera=(), geolocation=(), payment=(), usb=(), interest-cohort=(), microphone=(self)",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Permitted-Cross-Domain-Policies": "none",
};

/** Build a CSP string. Looser script policy in development for Next.js HMR. */
export function contentSecurityPolicy(isDev: boolean): string {
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function applySecurityHeaders(
  headers: Headers,
  options: { isDev?: boolean; includeHsts?: boolean } = {},
) {
  const isDev = options.isDev ?? process.env.NODE_ENV !== "production";
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  headers.set("Content-Security-Policy", contentSecurityPolicy(isDev));
  if (options.includeHsts && !isDev) {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
}
