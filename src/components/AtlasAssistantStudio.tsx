"use client";

import Link from "@/components/SiteLink";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { AtlasChatPanel } from "@/components/AtlasChatPanel";
import { CommandCenterRail } from "@/components/CommandCenterRail";
import { PersonalLifePanel } from "@/components/PersonalLifePanel";
import { TalkToAtlasStudio } from "@/components/TalkToAtlasStudio";
import { useSearchParams, useRouter } from "next/navigation";

function AtlasAssistantStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get("mode") ?? "command";

  return (
    <AppShell
      title="Talk to Atlas"
      subtitle="Command center for the whole product — chat, context, alerts, and actions connected to real company data."
      action={
        <div className="biz-switcher">
          <button type="button" className={mode === "command" ? "biz-tab active" : "biz-tab"} onClick={() => router.replace("/app/ask", { scroll: false })}>
            Command center
          </button>
          <button type="button" className={mode === "voice" ? "biz-tab active" : "biz-tab"} onClick={() => router.replace("/app/ask?mode=voice", { scroll: false })}>
            Voice
          </button>
          <button type="button" className={mode === "personal" ? "biz-tab active" : "biz-tab"} onClick={() => router.replace("/app/ask?mode=personal", { scroll: false })}>
            Personal
          </button>
        </div>
      }
    >
      {mode === "voice" ? (
        <div className="training-studio"><TalkToAtlasStudio /></div>
      ) : mode === "personal" ? (
        <div className="training-studio"><PersonalLifePanel /></div>
      ) : (
        <div className="command-center-layout">
          <div className="command-center-main">
            <AtlasChatPanel commandCenter />
          </div>
          <CommandCenterRail />
        </div>
      )}
      <p className="muted-line" style={{ marginTop: "1rem" }}>
        Records behind answers: <Link href="/app/workforce">Workforce</Link> ·{" "}
        <Link href="/app/business-engine">Business Engine</Link> ·{" "}
        <Link href="/app/approvals">Approvals</Link> ·{" "}
        <Link href="/app/workflows">Automations</Link>
      </p>
    </AppShell>
  );
}

export function AtlasAssistantStudio() {
  return (
    <Suspense fallback={<AppShell title="Talk to Atlas" subtitle="Loading…"><div className="panel">Loading…</div></AppShell>}>
      <AtlasAssistantStudioInner />
    </Suspense>
  );
}
