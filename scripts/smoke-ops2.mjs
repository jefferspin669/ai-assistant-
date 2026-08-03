import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";

const shots = "/opt/cursor/artifacts/screenshots";
mkdirSync(shots, { recursive: true });
const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log("PASS", name);
  } catch (e) {
    results.push({ name, ok: false, error: String(e.message || e) });
    console.log("FAIL", name, e.message || e);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

await check("connections-add-change", async () => {
  await page.goto("http://localhost:3000/app/connections", { waitUntil: "networkidle" });
  await page.getByLabel("Service name").fill("Jobber Demo");
  await page.getByLabel("What it does").fill("Field jobs");
  await page.getByRole("button", { name: "Add connection" }).click();
  await page.waitForSelector("text=Jobber Demo");
  await page.locator("article", { hasText: "Jobber Demo" }).getByRole("button", { name: "Change" }).click();
  await page.getByLabel("Account label").fill("ops@jobber.demo");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForSelector("text=ops@jobber.demo");
  await page.screenshot({ path: `${shots}/e2e-connections.png`, fullPage: true });
});

await check("confirmations-add-check", async () => {
  await page.goto("http://localhost:3000/app/confirmations", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-confirmations-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByPlaceholder("Refund customer").fill("Smoke refund");
  await page.getByPlaceholder("Issue a $240 refund to Elena Brooks").fill("Refund $50 to Pat");
  await page.getByRole("button", { name: "Add to queue" }).click();
  await page.waitForSelector("text=Needs confirmation");
  await page.getByRole("button", { name: "Confirm and continue" }).click();
  await page.waitForSelector("text=Approved");
  await page.getByRole("button", { name: "Check" }).first().click();
  await page.screenshot({ path: `${shots}/e2e-confirmations.png`, fullPage: true });
});

await check("feedback-problem-details", async () => {
  await page.goto("http://localhost:3000/app/feedback", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.removeItem("atlas-feedback-v1");
    localStorage.removeItem("atlas-feedback-prefs-v1");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("What went wrong").fill("Atlas booked the wrong day and never asked me first.");
  await page.getByRole("button", { name: "Submit problem details" }).click();
  await page.waitForSelector("text=Problem logged");
  await page.waitForSelector("text=report_problem");
  await page.getByRole("button", { name: "Helpful" }).first().click();
  await page.waitForSelector("text=Thanks");
  await page.screenshot({ path: `${shots}/e2e-feedback.png`, fullPage: true });
});

await check("testing-suites", async () => {
  await page.goto("http://localhost:3000/app/testing", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-test-runs-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Run", exact: true }).first().click();
  await page.waitForSelector("text=PASS");
  await page.waitForSelector("text=Login tests");
  const failedBadge = await page.locator(".stat").filter({ hasText: "Failed" }).locator("strong").innerText();
  if (failedBadge !== "0") throw new Error(`expected 0 failed login checks, got ${failedBadge}`);
  await page.getByRole("button", { name: "Run all tests" }).click();
  await page.waitForSelector("text=Full suite");
  await page.waitForSelector("text=Run history");
  await page.screenshot({ path: `${shots}/e2e-testing.png`, fullPage: true });
});

await check("tax-business-personal", async () => {
  await page.goto("http://localhost:3000/app/tax", { waitUntil: "networkidle" });
  await page.getByLabel("Label").fill("Smoke personal lunch");
  await page.getByLabel("Amount").fill("22");
  await page.locator("label").filter({ hasText: "For" }).locator("select").selectOption("personal");
  await page.getByRole("button", { name: /Save personal expense/ }).click();
  await page.waitForSelector("text=Smoke personal lunch");
  await page.getByRole("button", { name: "Personal", exact: true }).click();
  await page.waitForSelector("text=Smoke personal lunch");
  await page.screenshot({ path: `${shots}/e2e-tax-expenses.png`, fullPage: true });
});

await check("dashboard-profile", async () => {
  await page.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Your dashboard");
  await page.waitForSelector("text=Edit profile");
  await page.screenshot({ path: `${shots}/e2e-dashboard-profile.png`, fullPage: true });
});

writeFileSync("/tmp/ops2-smoke.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
if (results.some((r) => !r.ok)) process.exit(1);
