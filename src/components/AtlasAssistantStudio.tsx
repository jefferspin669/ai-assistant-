"use client";

import Link from "@/components/SiteLink";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AtlasChatPanel } from "@/components/AtlasChatPanel";
import { CommandCenterRail } from "@/components/CommandCenterRail";
import { PersonalLifePanel } from "@/components/PersonalLifePanel";
import { TalkToAtlasStudio } from "@/components/TalkToAtlasStudio";
import { useAccount } from "@/components/AccountProvider";

const TABS = [
  { id: "chat", label: "Chat" },
  { id: "voice", label: "Voice" },
  { id: "personal", label: "Personal" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const ROLES = [
  { id: "ceo", label: "CEO" },
  { id: "manager", label: "Manager" },
  { id: "employee", label: "Employee" },
] as const;

type RoleId = (typeof ROLES)[number]["id"];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

function isRole(value: string | null): value is RoleId {
  return ROLES.some((role) => role.id === value);
}

function AtlasAssistantStudioInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ownerName } = useAccount();
  const tabParam = searchParams.get("tab");
  const roleParam = searchParams.get("role");
  const tab: TabId = isTab(tabParam) ? tabParam : "chat";
  const role: RoleId = isRole(roleParam) ? roleParam : "ceo";

  const roleBlurb = useMemo(() => {
    switch (role) {
      case "ceo":
        return "CEO insights, approvals, reports, and planning — Atlas runs the company with your permissions.";
      case "manager":
        return "Team and project assistance — assign work, see workload, and unblock your crew.";
      default:
        return "Your tasks, schedule, company questions, and work help — same brain, employee context.";
    }
  }, [role]);

  function setTab(next: TabId) {
    router.replace(`/app/ask?tab=${next}&role=${role}`, { scroll: false });
  }

  function setRole(next: RoleId) {
    router.replace(`/app/ask?tab=${tab}&role=${next}`, { scroll: false });
  }

  const showCommandCenter = role === "ceo" && tab === "chat";

  return (
    <AppShell
      title="Atlas Assistant"
      subtitle="Personalized AI for whoever is logged in — one brain, role-based context and permissions."
      action={
        <div className="biz-switcher" role="group" aria-label="Your role">
          {ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={role === item.id ? "biz-tab active" : "biz-tab"}
              onClick={() => setRole(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="training-studio">
        <div className="memory-card">
          <div className="label">
            {ownerName ? `${ownerName} · ` : ""}
            {ROLES.find((r) => r.id === role)?.label} view
          </div>
          <p>{roleBlurb}</p>
        </div>

        <div className="training-tabs" role="tablist" aria-label="Atlas Assistant">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "training-tab active" : "training-tab"}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {showCommandCenter ? (
          <div className="command-center-layout">
            <div className="command-center-main">
              <AtlasChatPanel commandCenter />
            </div>
            <CommandCenterRail />
          </div>
        ) : null}
        {!showCommandCenter && tab === "chat" ? <AtlasChatPanel /> : null}
        {tab === "voice" ? <TalkToAtlasStudio /> : null}
        {tab === "personal" ? <PersonalLifePanel /> : null}
      </div>
      {showCommandCenter ? (
        <p className="muted-line" style={{ marginTop: "1rem" }}>
          Records behind answers: <Link href="/app/workforce">Workforce</Link> ·{" "}
          <Link href="/app/business-engine">Business Engine</Link> ·{" "}
          <Link href="/app/approvals">Approvals</Link> ·{" "}
          <Link href="/app/workflows">Automations</Link>
        </p>
      ) : null}
    </AppShell>
  );
}

export function AtlasAssistantStudio() {
  return (
    <Suspense fallback={<AppShell title="Atlas Assistant" subtitle="Loading…"><div className="panel">Loading…</div></AppShell>}>
      <AtlasAssistantStudioInner />
    </Suspense>
  );
}
