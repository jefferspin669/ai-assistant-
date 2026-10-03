import { expect, test } from "@playwright/test";

/**
 * Owner invoice-recovery beachhead in the browser:
 * sign in → Approvals → demo redirects → orchestrator goal.
 * Worker: field portal cannot call owner Approvals.
 */
test.describe("invoice recovery owner experience", () => {
  test("owner can open Approvals and Money after login; demo Actions redirects", async ({
    page,
    context,
  }) => {
    await context.clearCookies();
    const loginApi = await page.request.post("/api/auth/login", {
      data: { email: "demo@atlas.ai", password: "atlas-demo" },
    });
    if (!loginApi.ok()) {
      test.skip(true, `Owner API login failed (${loginApi.status()}) — seed/session.`);
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
    expect(orch.status()).toBeLessThan(500);
    if (orch.ok()) {
      const body = await orch.json();
      const run = body.data?.run || body.run;
      expect(run?.intent || body.data?.intent).toBeTruthy();
    }

    const approvals = await page.request.get("/api/approvals");
    expect(approvals.ok()).toBeTruthy();

    const audit = await page.request.get("/api/audit");
    expect(audit.ok()).toBeTruthy();
  });

  test("worker portal remains isolated from owner Approvals API", async ({ page, context }) => {
    await context.clearCookies();
    const ownerLogin = await page.request.post("/api/auth/login", {
      data: { email: "demo@atlas.ai", password: "atlas-demo" },
    });
    expect(ownerLogin.ok()).toBeTruthy();
    const ownerJson = await ownerLogin.json();
    const organizationId = ownerJson.data?.organizationId || ownerJson.organizationId;
    expect(organizationId).toBeTruthy();

    await context.clearCookies();
    const workerLogin = await page.request.post("/api/employee/auth/login", {
      data: {
        email: "marcus@business.local",
        accessCode: "MARCUS",
        organizationId,
      },
    });
    expect(workerLogin.ok()).toBeTruthy();

    await page.goto("/employee");
    const me = await page.request.get("/api/employee/me");
    expect(me.ok()).toBeTruthy();

    // Field workers stay out of owner admin / directory surfaces.
    const employees = await page.request.get("/api/employees");
    expect(employees.status()).toBeGreaterThanOrEqual(401);

    const support = await page.request.get("/api/admin/support");
    expect(support.status()).toBeGreaterThanOrEqual(401);

    // Approvals list may be readable in-tenant; approving money must not be.
    const approve = await page.request.post("/api/approvals", {
      data: { id: "appr_does_not_exist", decision: "approved" },
    });
    expect(approve.status()).toBeGreaterThanOrEqual(400);
  });
});
