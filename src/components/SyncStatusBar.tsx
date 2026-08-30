"use client";

import Link from "@/components/SiteLink";
import { useEffect, useState } from "react";
import { flushOfflineQueue, isOffline, refreshOfflineCache } from "@/lib/offline";
import {
  getSyncStatus,
  subscribeSyncStatus,
  type SyncStatusEvent,
} from "@/lib/sync-status";

export function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatusEvent>(getSyncStatus());
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = subscribeSyncStatus(setStatus);
    const syncOnline = () => {
      const off = isOffline();
      setOffline(off);
      if (!off) {
        refreshOfflineCache();
        flushOfflineQueue();
      }
    };
    syncOnline();
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    return () => {
      unsub();
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
    };
  }, []);

  return (
    <div className={`sync-status sync-status-${status.kind}${offline ? " is-offline" : ""}`}>
      <span className="sync-dot" aria-hidden />
      <div className="sync-copy">
        <strong>{offline && status.kind !== "offline" ? "Offline" : status.label}</strong>
        <small>{status.detail}</small>
      </div>
      <Link href="/app/offline" className="ghost-link">
        Details
      </Link>
    </div>
  );
}
