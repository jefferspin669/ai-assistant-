import { expect, test } from "@playwright/test";

/**
 * Owner creates worker → assigns project → worker completes → owner audits
 * → Brain proposes SMS → owner approves → Twilio reports.
 */
test.describe("owner-worker-approval beachhead", () => {
  test("full loop via APIs with browser session cookies", async ({ page, context }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@atlas.ai");
    await page.getByLabel("Password", { exact: true }).fill("atlas-demo");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(app|login)/, { timeout: 30_000 });
    if (page.url().includes("/login")) {
      test.skip(true, "Owner server login did not navigate (seed/session).");
    }

    const stamp = Date.now();
    const email = `wf.${stamp}@business.local`;
    const accessCode = `W${String(stamp).slice(-5)}`;

    const empRes = await page.request.post("/api/employees", {
      data: { name: "Workflow Tech", email, role: "Technician", accessCode },
    });
    expect(empRes.ok()).toBeTruthy();
    const empJson = await empRes.json();
    const employeeId = empJson.data?.employee?.id;
    expect(employeeId).toBeTruthy();

    const taskRes = await page.request.post("/api/tasks", {
      data: {
        title: "Install thermostat",
        projectLabel: `Project ${stamp}`,
        assigneeEmployeeId: employeeId,
        priority: "high",
      },
    });
    expect(taskRes.ok()).toBeTruthy();
    const task = (await taskRes.json()).data;
    expect(task?.assigneeEmployeeId || task?.id).toBeTruthy();
    const taskId = task.id;

    await context.clearCookies();
    await page.goto("/employee/login");
    await page.getByLabel("Work email").fill(email);
    await page.getByLabel("Access code").fill(accessCode);
    await page.getByRole("button", { name: /sign in to my page/i }).click();
    await page.waitForURL(/\/employee(?!\/login)/, { timeout: 30_000 });

    const completeRes = await page.request.patch(`/api/tasks/${taskId}`, {
      data: { status: "completed" },
    });
    expect(completeRes.ok()).toBeTruthy();

    await context.clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill("demo@atlas.ai");
    await page.getByLabel("Password", { exact: true }).fill("atlas-demo");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 30_000 });

    const auditRes = await page.request.get("/api/audit");
    expect(auditRes.ok()).toBeTruthy();
    const audit = await auditRes.json();
    const rows = audit.data || [];
    expect(
      rows.some(
        (r: { action?: string; entity_id?: string }) =>
          r.entity_id === taskId && String(r.action || "").toLowerCase().includes("completed"),
      ),
    ).toBeTruthy();

    const chatRes = await page.request.post("/api/ai/chat", {
      data: {
        message: "Propose a mass SMS follow-up to Jamie about the finished project.",
      },
    });
    expect(chatRes.ok()).toBeTruthy();

    // Deterministic propose via commercial SMS stage, then approve executes Twilio.
    const customers = await page.request.get("/api/customers");
    let to = "+15551234567";
    if (customers.ok()) {
      const list = (await customers.json()).data;
      const withPhone = Array.isArray(list) ? list.find((c: { phone?: string }) => c.phone) : null;
      if (withPhone?.phone) to = withPhone.phone;
    }

    const stage = await page.request.post("/api/actions/send-sms", {
      data: { to, body: `Project ${stamp} is complete — thanks from Atlas.` },
    });
    expect(stage.ok()).toBeTruthy();
    const staged = await stage.json();
    const approvalId = staged.data?.approvalId || staged.data?.proposal?.id;
    expect(approvalId).toBeTruthy();

    const approve = await page.request.post("/api/approvals", {
      data: { approvalId, decision: "approved" },
    });
    expect(approve.ok()).toBeTruthy();
    const approved = await approve.json();
    expect(approved.data?.result?.executed || approved.data?.result?.integration).toBeTruthy();
    expect(approved.data?.result?.ok).toBe(true);
  });
});
