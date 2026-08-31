import type { NextConfig } from "next";
import {
  SECURITY_HEADERS,
  contentSecurityPolicy,
} from "./src/lib/security-headers";

const isDev = process.env.NODE_ENV !== "production";
/** GitHub Pages static export (project site under /ai-assistant-). */
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const pagesBasePath = "/ai-assistant-";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["postgres", "ioredis", "bullmq", "openai", "twilio", "stripe", "resend"],
  // Expose basePath to client hard-navigation helpers (auth redirects on Pages).
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? pagesBasePath : "",
  },
  // Server-only modules (e.g. the file-backed DB in src/lib/db/file-persist.ts)
  // are reached through isomorphic helpers that some client components import.
  // Those helpers guard every Node call behind `typeof window === "undefined"`,
  // so the browser never executes them — we just need webpack to stop trying to
  // bundle Node built-ins into the client bundle (otherwise: "Can't resolve 'fs'").
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    return config;
  },
  ...(isGitHubPages
    ? {
        output: "export" as const,
        basePath: pagesBasePath,
        assetPrefix: pagesBasePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        images: {
          remotePatterns: [
            {
              protocol: "https",
              hostname: "images.unsplash.com",
            },
          ],
        },
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                ...Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
                  key,
                  value,
                })),
                {
                  key: "Content-Security-Policy",
                  value: contentSecurityPolicy(isDev),
                },
                ...(!isDev
                  ? [
                      {
                        key: "Strict-Transport-Security",
                        value:
                          "max-age=63072000; includeSubDomains; preload",
                      },
                    ]
                  : []),
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
