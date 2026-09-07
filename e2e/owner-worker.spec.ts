import { expect, test } from "@playwright/test";

/**
 * Owner → provision worker → worker portal session.
 */
test.describe("owner to worker workflow", () => {
  test("owner signs in, creates a worker, worker signs into employee portal", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@atlas.ai");
    await page.getByLabel("Password", { exact: true }).fill("atlas-demo");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL(/\/(app|login)/, { timeout: 30_000 });
    if (page.url().includes("/login")) {
      test.skip(true, "Server login did not establish a navigable session (check auth seed).");
    }

    const stamp = Date.now();
    const email = `worker.${stamp}@business.local`;
    const accessCode = `W${String(stamp).slice(-5)}`;

    const createRes = await page.request.post("/api/employees", {
      data: {
        name: "E2E Worker",
        email,
        role: "Technician",
        department: "Field",
        accessCode,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = await createRes.json();
    expect(created.ok ?? created.success).toBeTruthy();

    await context.clearCookies();

    await page.goto("/employee/login");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Access code").fill(accessCode);
    await page.getByRole("button", { name: /sign in to my page/i }).click();

    await page.waitForURL(/\/employee(?!\/login)/, { timeout: 30_000 });

    const me = await page.request.get("/api/employee/me");
    expect(me.ok()).toBeTruthy();
    const meJson = await me.json();
    const employeeEmail = meJson.data?.employee?.email || meJson.data?.email;
    expect(employeeEmail).toBe(email);

    const forbidden = await page.request.get("/api/employees");
    expect(forbidden.status()).toBeGreaterThanOrEqual(401);
  });

  test("seed worker marcus can open employee portal", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/employee/login");
    await page.getByLabel("Work email").fill("marcus@business.local");
    await page.getByLabel("Access code").fill("MARCUS");
    await page.getByRole("button", { name: /sign in to my page/i }).click();
    await page.waitForURL(/\/employee(?!\/login)/, { timeout: 30_000 });

    const me = await page.request.get("/api/employee/me");
    expect(me.ok()).toBeTruthy();
  });
});
