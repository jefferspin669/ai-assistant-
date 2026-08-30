"use client";

import NextLink, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { sitePath } from "@/lib/hard-nav";

/**
 * Drop-in replacement for `next/link`.
 *
 * On GitHub Pages static export, App Router soft navigation fetches RSC
 * `index.txt` payloads that Pages serves as `text/plain`, which can paint as
 * raw Flight text (`1:"$Sreact.fragment"…`). Plain anchors force a full
 * document load of `index.html` instead.
 *
 * In local/dev (no basePath), this delegates to Next.js `Link` unchanged.
 */

const useHardNav = Boolean(process.env.NEXT_PUBLIC_BASE_PATH);

type SiteLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children?: ReactNode;
  };

function hrefToPath(href: LinkProps["href"]): string {
  if (typeof href === "string") return href;
  const pathname = href.pathname || "/";
  const search = href.search || "";
  const hash = href.hash || "";
  return `${pathname}${search}${hash}`;
}

export function SiteLink({ href, children, ...rest }: SiteLinkProps) {
  if (useHardNav) {
    const {
      replace: _replace,
      scroll: _scroll,
      prefetch: _prefetch,
      ...anchorProps
    } = rest;
    const path = hrefToPath(href);
    const resolved =
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("mailto:") ||
      path.startsWith("tel:")
        ? path
        : sitePath(path.startsWith("/") ? path : `/${path}`);
    return (
      <a href={resolved} {...anchorProps}>
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} {...rest}>
      {children}
    </NextLink>
  );
}

export default SiteLink;
