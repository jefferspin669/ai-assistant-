"use client";

import type { IntegrationMode } from "@/lib/integrations/config";
import { connectionBadge } from "@/lib/integrations/config";

/** Honest Live / Partial / Simulation / Unavailable chip for integration surfaces. */
export function ConnectionStatusBadge({ mode }: { mode: IntegrationMode }) {
  const badge = connectionBadge(mode);
  const className =
    badge.tone === "ok"
      ? "badge ok"
      : badge.tone === "warn"
        ? "badge warn"
        : badge.tone === "danger"
          ? "badge danger"
          : "badge";
  return <span className={className}>{badge.label}</span>;
}
