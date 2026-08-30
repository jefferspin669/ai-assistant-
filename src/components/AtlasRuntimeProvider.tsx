"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DEFAULT_RUNTIME,
  dismissAwayReport,
  loadAtlasRuntime,
  pauseAtlas,
  returnFromAway,
  saveAtlasRuntime,
  setAutonomyLevel,
  startOwnerAway,
  type AtlasRuntimeState,
  type AutonomyLevelId,
} from "@/lib/atlas-runtime";

type AtlasRuntimeContextValue = {
  runtime: AtlasRuntimeState;
  setLevel: (level: AutonomyLevelId) => void;
  setPaused: (paused: boolean) => void;
  leave: () => void;
  comeBack: () => void;
  dismissReport: () => void;
};

const AtlasRuntimeContext = createContext<AtlasRuntimeContextValue | null>(null);

export function AtlasRuntimeProvider({ children }: { children: ReactNode }) {
  const [runtime, setRuntime] = useState<AtlasRuntimeState>(DEFAULT_RUNTIME);

  useEffect(() => {
    setRuntime(loadAtlasRuntime());
  }, []);

  const commit = useCallback((next: AtlasRuntimeState) => {
    setRuntime(next);
    saveAtlasRuntime(next);
  }, []);

  const value = useMemo<AtlasRuntimeContextValue>(
    () => ({
      runtime,
      setLevel: (level) => commit(setAutonomyLevel(runtime, level)),
      setPaused: (paused) => commit(pauseAtlas(runtime, paused)),
      leave: () => commit(startOwnerAway(runtime)),
      comeBack: () => commit(returnFromAway(runtime)),
      dismissReport: () => commit(dismissAwayReport(runtime)),
    }),
    [commit, runtime],
  );

  return <AtlasRuntimeContext.Provider value={value}>{children}</AtlasRuntimeContext.Provider>;
}

export function useAtlasRuntime() {
  const ctx = useContext(AtlasRuntimeContext);
  if (!ctx) {
    throw new Error("useAtlasRuntime must be used inside AtlasRuntimeProvider");
  }
  return ctx;
}
