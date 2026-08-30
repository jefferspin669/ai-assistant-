"use client";

import { useCallback, useEffect, useState } from "react";
import { atlasClient } from "@/lib/api/client";
import type { Customer } from "@/lib/domain/types";

export function useCustomers(ready: boolean) {
  const [data, setData] = useState<Customer[] | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!ready) {
      setData(undefined);
      setError("Sign in to load customers.");
      return;
    }
    setIsLoading(true);
    const result = await atlasClient.customers.list();
    setIsLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setError(null);
    setData(result.data);
  }, [ready]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { data, error, isLoading, refresh };
}
