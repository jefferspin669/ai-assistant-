/**
 * Hard navigation helpers for static GitHub Pages.
 *
 * Next.js App Router soft-navigation fetches RSC `index.txt` payloads. On GitHub
 * Pages those arrive as `text/plain` and can render as raw Flight protocol text
 * (`1:"$Sreact.fragment"…`) after Sign in / Log in. Full document loads of
 * `index.html` avoid that failure mode.
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Normalize an app path to include trailing slash (Pages static export). */
export function withTrailingSlash(path: string) {
  if (!path || path === "/") return "/";
  const [pathname, query = ""] = path.split("?");
  const cleaned = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const slashed = cleaned.endsWith("/") ? cleaned : `${cleaned}/`;
  return query ? `${slashed}?${query}` : slashed;
}

/** Absolute site path including optional Pages basePath. */
export function sitePath(path: string) {
  const slashed = withTrailingSlash(path);
  if (!BASE_PATH) return slashed;
  if (slashed === "/") return `${BASE_PATH}/`;
  return `${BASE_PATH}${slashed}`;
}

/** Full page navigation — use for auth redirects on static hosts. */
export function hardNavigate(path: string) {
  if (typeof window === "undefined") return;
  window.location.assign(sitePath(path));
}
