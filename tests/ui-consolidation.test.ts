import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiSuccess, parseBody } from "../src/lib/api/http";
import { navGroups, navItems } from "../src/lib/atlas-platform";
import { sidebarAdmin, sidebarMain } from "../src/lib/sidebar-nav";
import { memoryHub, moneyHub, trustHub } from "../src/lib/section-hubs";

describe("product consolidation", () => {
  const labels = navGroups.map((group) => group.label);
  const hrefs = navItems.map((item) => item.href);

  it("groups Money, Atlas Memory, and Trust & Governance as parents", () => {
    expect(labels).toContain("Money");
    expect(labels).toContain("Atlas Memory");
    expect(labels).toContain("Trust & Governance");
  });

  it("keeps Approvals and Marketplace; consolidates primary product nav", () => {
    expect(hrefs).toContain("/app/approvals");
    expect(hrefs).toContain("/app/marketplace");
    expect(hrefs).toContain("/app/ask");
    expect(hrefs).toContain("/app/workforce");
    expect(hrefs).toContain("/app/appointments");
    expect(hrefs).not.toContain("/app/confirmations");
    expect(hrefs).not.toContain("/app/app-store");
    expect(hrefs).not.toContain("/app/chat");
    expect(hrefs).not.toContain("/app/digital-employees");
    expect(hrefs).not.toContain("/app/events");
    expect(hrefs).not.toContain("/app/personal");
    expect(hrefs).not.toContain("/app/talk");
    expect(navItems.find((item) => item.href === "/app/chatbot")?.label).toBe("Customer Chatbot");
  });

  it("pins Talk to Atlas on the primary sidebar", () => {
    const chat = sidebarMain.find((item) => item.icon === "chat");
    expect(chat?.href).toBe("/app/ask");
    expect(chat?.label).toBe("Talk to Atlas");
  });

  it("puts Tax under Money instead of pinning it as a second product", () => {
    const money = navGroups.find((group) => group.label === "Money");
    expect(money?.items.map((item) => item.href)).toContain("/app/tax");
    expect(sidebarMain.concat(sidebarAdmin).map((item) => item.href)).not.toContain("/app/tax");
  });

  it("lists Intelligence hubs in nav catalog", () => {
    const intelligence = navGroups.find((group) => group.label === "Intelligence");
    const hrefs = intelligence?.items.map((item) => item.href) ?? [];
    expect(hrefs).toContain("/app/ask");
    expect(hrefs).toContain("/app/business-engine");
    expect(hrefs).toContain("/app/market-intelligence");
    expect(hrefs).toContain("/app/quality");
    expect(hrefs).toContain("/app/security-center");
  });

  it("exposes Security Center on Trust hub", () => {
    expect(trustHub.map((item) => item.href)).toContain("/app/security-center");
    expect(trustHub.map((item) => item.label)).toEqual([
      "Security Center",
      "Security",
      "Risk",
      "Compliance",
      "Governance",
      "Privacy",
      "Audit Log",
    ]);
  });

  it("exposes Money / Memory hubs without a second store", () => {
    expect(moneyHub.map((item) => item.href)).toEqual([
      "/app/finance",
      "/app/payments",
      "/app/tax",
      "/app/accountant",
    ]);
    expect(memoryHub.some((item) => item.href === "/app/ceo-memory")).toBe(true);
  });

  it("drops Command Language from nav", () => {
    expect(hrefs).not.toContain("/app/command-language");
  });

  it("parses bodies and returns apiSuccess without per-route wrappers", async () => {
    const parsed = parseBody(z.object({ name: z.string() }), { name: "Johnson Construction" });
    expect(parsed.name).toBe("Johnson Construction");
    const res = apiSuccess({ ok: true });
    const json = (await res.json()) as { success: boolean; data: { ok: boolean } };
    expect(json.success).toBe(true);
    expect(json.data.ok).toBe(true);
  });
});
