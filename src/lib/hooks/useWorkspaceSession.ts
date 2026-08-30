"use client";

import { useCallback, useEffect, useState } from "react";
import type { SessionContext } from "@/lib/domain/types";
import { atlasClient } from "@/lib/api/client";

export function useWorkspaceSession() {
  const [ctx, setCtx] = useState<SessionContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/session", { cache: "no-store", credentials: "include" });
    const json = (await res.json()) as { success?: boolean; data?: SessionContext; error?: string };
    if (!json.success || !json.data) {
      setCtx(null);
      setError(json.error || "No workspace session.");
      return;
    }
    setError(null);
    setCtx(json.data);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ctx, error, refresh, client: atlasClient };
}
