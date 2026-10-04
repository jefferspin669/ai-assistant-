import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { campaignSummary, loadConnectedAccounts, marketingDataMode } from "../src/lib/marketing-workspace";
import { reputationMode, loadReviewSources, saveReviewSources } from "../src/lib/reputation-workspace";
import { loadConnections } from "../src/lib/connections";
import { enterPreviewWorkspace } from "../src/lib/workspace-mode";
import { resetDatabase, loadDatabase } from "../src/lib/db/store";
import { mintDevSession } from "../src/lib/auth/session";
import { GET as settingsGet, PUT as settingsPut } from "../src/app/api/settings/route";
import { GET as approvalsGet } from "../src/app/api/approvals/route";
import { POST as customersPost, GET as customersGet } from "../src/app/api/customers/route";

beforeEach(() => {
  resetDatabase();
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("ATLAS_ENV", "development");
  const store: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { localStorage: storage });
  enterPreviewWorkspace();
});

function cookieHeader() {
  const session = mintDevSession();
  return `atlas_session=${session.token}`;
}

describe("honesty repair pass", () => {
  it("keeps marketing and reputation DEMO even when local toggles claim connected", () => {
    expect(marketingDataMode()).toBe("DEMO");
    expect(campaignSummary().mode).toBe("DEMO");
    expect(loadConnectedAccounts().every((a) => !a.connected)).toBe(true);

    saveReviewSources(loadReviewSources().map((s) => ({ ...s, connected: true })));
    expect(reputationMode()).toBe("DEMO");
  });

  it("seeds catalog connections as disconnected", () => {
    const rows = loadConnections();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => !r.connected && r.health === "disconnected")).toBe(true);
  });

  it("publishes chatbot FAQ fields on /api/settings", async () => {
    const cookie = cookieHeader();
    const put = await settingsPut(
      new Request("http://atlas.test/api/settings", {
        method: "PUT",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({
          publicHours: "Mon–Fri 8–5",
          publicServices: "Drain cleaning, water heaters",
          publicPricing: "Service call $89",
          publicAddress: "Austin, TX",
        }),
      }),
    );
    expect(put.status).toBe(200);
    const get = await settingsGet(
      new Request("http://atlas.test/api/settings", { headers: { cookie } }),
    );
    const json = (await get.json()) as {
      ok: boolean;
      data: {
        publicHours: string | null;
        publicServices: string | null;
        publicPricing: string | null;
        publicAddress: string | null;
      };
    };
    expect(json.ok).toBe(true);
    expect(json.data.publicHours).toBe("Mon–Fri 8–5");
    expect(json.data.publicServices).toContain("Drain");
    expect(json.data.publicPricing).toContain("$89");
    expect(json.data.publicAddress).toContain("Austin");
  });

  it("creates CRM leads that appear in GET /api/customers", async () => {
    const cookie = cookieHeader();
    const created = await customersPost(
      new Request("http://atlas.test/api/customers", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ name: "Website visitor", status: "lead" }),
      }),
    );
    expect(created.status).toBe(200);
    const body = (await created.json()) as { ok: boolean; data: { id: string; name: string } };
    expect(body.ok).toBe(true);
    const listed = await customersGet(
      new Request("http://atlas.test/api/customers", { headers: { cookie } }),
    );
    const listJson = (await listed.json()) as { ok: boolean; data: Array<{ id: string }> };
    expect(listJson.data.some((row) => row.id === body.data.id)).toBe(true);
  });

  it("serves approvals from the server queue only", async () => {
    const cookie = cookieHeader();
    const orgId = loadDatabase().organizations[0]!.id;
    const response = await approvalsGet(
      new Request("http://atlas.test/api/approvals", { headers: { cookie } }),
    );
    expect(response.status).toBe(200);
    const json = (await response.json()) as { ok: boolean; data: Array<{ organization_id: string }> };
    expect(json.ok).toBe(true);
    expect(json.data.every((row) => row.organization_id === orgId)).toBe(true);

    const inbox = readFileSync(join(process.cwd(), "src/components/ApprovalInboxStudio.tsx"), "utf8");
    expect(inbox).toContain("/api/approvals");
    expect(inbox).not.toMatch(/localStorage|loadApprovalRequests|seedApprovalsIfEmpty/);
  });

  it("disables document and tax fake export/share claims in source", () => {
    const docs = readFileSync(join(process.cwd(), "src/components/DocumentStudio.tsx"), "utf8");
    expect(docs).toMatch(/Download PDF[\s\S]*disabled/);
    expect(docs).not.toContain("queued (demo)");
    expect(docs).not.toContain("Share link copied (demo)");

    const tax = readFileSync(join(process.cwd(), "src/components/TaxCenterAdvanced.tsx"), "utf8");
    expect(tax).toMatch(/Export PDF[\s\S]*disabled|disabled[\s\S]*Export PDF/);
    expect(tax).not.toContain("Accountant-ready PDF exported.");
    expect(tax).not.toContain("Atlas shared the package with your professional");
  });

  it("keeps chatbot free of Smith Plumbing fiction", () => {
    const page = readFileSync(join(process.cwd(), "src/app/app/chatbot/page.tsx"), "utf8");
    expect(page).not.toMatch(/Smith Plumbing/i);
    expect(page).toContain("publicHours");
    expect(page).toContain("/api/customers");
  });
});
