import type { NextConfig } from "next";
import {
  SECURITY_HEADERS,
  contentSecurityPolicy,
} from "./src/lib/security-headers";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
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
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
