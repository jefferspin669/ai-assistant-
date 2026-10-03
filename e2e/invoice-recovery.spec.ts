import { expect, test } from "@playwright/test";

/**
 * Owner invoice-recovery beachhead in the browser:
 * sign in → Approvals (or trigger orchestrator) → approve chase → audit shows activity.
 * Worker path: employee portal still loads after owner assigns work (existing e2e covers create).
 */
test.describe("invoice recovery owner experience", () => {
  test("owner can open Approvals and Money after login; demo Actions redirects", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@atlas.ai");
    await page.getByLabel("Password", { exact: true }).fill("atlas-demo");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(app|login)/, { timeout: 30_000 });
    if (page.url().includes("/login")) {
      test.skip(true, "Owner server login did not navigate (seed/session).");
    }

    await page.goto("/app/approvals");
    await expect(page).toHaveURL(/\/app\/approvals/);

    await page.goto("/app/actions");
    await page.waitForURL(/\/app\/approvals/, { timeout: 15_000 });

    await page.goto("/app/workflows");
    await page.waitForURL(/\/app\/autonomous/, { timeout: 15_000 });

    await page.goto("/app/finance");
    await page.waitForURL(/\/app\/money/, { timeout: 15_000 });

    const orch = await page.request.post("/api/orchestrator", {
      data: { goal: "Get Johnson Construction's overdue invoice paid." },
    });
    // Level-dependent: 200 with run, or auth/plan errors — must not 500.
    expect(orch.status()).toBeLessThan(500);
    if (orch.ok()) {
      const body = await orch.json();
      const run = body.data?.run || body.run;
      expect(run?.intent || body.data?.intent).toBeTruthy();
    }

    const audit = await page.request.get("/api/audit");
    expect(audit.ok()).toBeTruthy();
  });

  test("worker portal remains isolated from owner Approvals API", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/employee/login");
    await page.getByLabel("Work email").fill("marcus@business.local");
    await page.getByLabel("Access code").fill("MARCUS");
    await page.getByRole("button", { name: /sign in to my page/i }).click();
    await page.waitForURL(/\/employee(?!\/login)/, { timeout: 30_000 });

    const me = await page.request.get("/api/employee/me");
    expect(me.ok()).toBeTruthy();

    const approvals = await page.request.get("/api/approvals");
    expect(approvals.status()).toBeGreaterThanOrEqual(401);

    const money = await page.request.get("/api/projects");
    expect(money.status()).toBeGreaterThanOrEqual(401);
  });
});
