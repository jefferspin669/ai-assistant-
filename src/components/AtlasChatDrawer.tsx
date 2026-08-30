"use client";

import { useEffect, useState } from "react";
import { AtlasChatPanel } from "@/components/AtlasChatPanel";

export function AtlasChatDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="atlas-chat-fab"
        onClick={() => setOpen(true)}
        aria-label="Talk to Atlas"
      >
        <span aria-hidden="true">💬</span>
        Talk to Atlas
      </button>

      {open ? (
        <div className="atlas-chat-drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      ) : null}

      <aside
        className={`atlas-chat-drawer${open ? " open" : ""}`}
        aria-hidden={!open}
        aria-label="Talk to Atlas"
      >
        <div className="atlas-chat-drawer-head">
          <div>
            <p className="briefing-kicker">Command center</p>
            <h2>Talk to Atlas</h2>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => setOpen(false)} aria-label="Close">
            Close
          </button>
        </div>
        <AtlasChatPanel compact />
      </aside>
    </>
  );
}
