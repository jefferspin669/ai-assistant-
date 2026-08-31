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

  it("keeps Approvals and Marketplace; drops duplicate nav entries", () => {
    expect(hrefs).toContain("/app/approvals");
    expect(hrefs).toContain("/app/marketplace");
    expect(hrefs).toContain("/app/ask");
    expect(hrefs).not.toContain("/app/confirmations");
    expect(hrefs).not.toContain("/app/app-store");
    expect(hrefs).not.toContain("/app/chat");
    expect(navItems.find((item) => item.href === "/app/chatbot")?.label).toBe("Customer Chatbot");
  });

  it("puts Tax under Money instead of pinning it as a second product", () => {
    const money = navGroups.find((group) => group.label === "Money");
    expect(money?.items.map((item) => item.href)).toContain("/app/tax");
    expect(sidebarMain.concat(sidebarAdmin).map((item) => item.href)).not.toContain("/app/tax");
  });

  it("pins Ask Atlas on the primary sidebar", () => {
    const chat = sidebarMain.find((item) => item.icon === "chat");
    expect(chat?.href).toBe("/app/ask");
    expect(chat?.label).toBe("Ask Atlas");
  });

  it("exposes Money / Memory / Trust hubs without a second store", () => {
    expect(moneyHub.map((item) => item.href)).toEqual([
      "/app/finance",
      "/app/payments",
      "/app/tax",
      "/app/accountant",
    ]);
    expect(memoryHub.some((item) => item.href === "/app/ceo-memory")).toBe(true);
    expect(trustHub.map((item) => item.label)).toEqual([
      "Security",
      "Risk",
      "Compliance",
      "Governance",
      "Privacy",
      "Audit Log",
    ]);
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
