import { chromium } from "playwright";
import { writeFileSync } from "fs";

const shots = "/opt/cursor/artifacts/screenshots";
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

await check("calendar-add-delete", async () => {
  await page.goto("http://localhost:3000/app/appointments", { waitUntil: "networkidle" });
  await page.locator("form").filter({ hasText: "Add to" }).getByLabel("Title").fill("Test delete event");
  await page.locator("form").filter({ hasText: "Add to" }).getByRole("button", { name: /Add to/ }).click();
  await page.waitForSelector("text=Test delete event");
  await page.getByRole("button", { name: "Delete Test delete event" }).first().click();
  await page.waitForSelector("text=Deleted");
  await page.screenshot({ path: `${shots}/e2e-calendar.png`, fullPage: true });
});

await check("one-calendar-redirect", async () => {
  await page.goto("http://localhost:3000/app/scheduling", { waitUntil: "networkidle" });
  await page.waitForURL("**/app/appointments");
});

await check("board-decision", async () => {
  await page.goto("http://localhost:3000/app/board", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-board-decisions-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("banner").getByRole("button", { name: "New decision" }).click();
  await page.getByPlaceholder("Should we hire an apprentice this quarter?").fill("Should we hire an apprentice?");
  await page.getByRole("button", { name: "Ask board" }).click();
  await page.waitForSelector("text=Board summary");
  await page.getByRole("button", { name: "Save decision" }).click();
  await page.waitForSelector("text=Your decisions");
  await page.getByRole("button", { name: "Delete" }).first().click();
  await page.screenshot({ path: `${shots}/e2e-board.png`, fullPage: true });
});

await check("health-score", async () => {
  await page.goto("http://localhost:3000/app/score", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Change score" }).click();
  await page.getByLabel("Exact value").fill("91");
  await page.getByRole("button", { name: /Save score/ }).click();
  await page.waitForSelector("text=Health score set to 91");
  await page.screenshot({ path: `${shots}/e2e-score.png`, fullPage: true });
});

await check("dashboard-ask", async () => {
  await page.goto("http://localhost:3000/app/analytics", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Why were sales lower this week?" }).click();
  await page.waitForSelector("text=Two rainy days");
  await page.screenshot({ path: `${shots}/e2e-dashboard.png`, fullPage: true });
});

await check("risk-details", async () => {
  await page.goto("http://localhost:3000/app/risk", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Risk details");
  await page.getByRole("button", { name: "Remind me later" }).click();
  await page.waitForSelector("text=Reminder set");
  await page.screenshot({ path: `${shots}/e2e-risk.png`, fullPage: true });
});

await check("call-summary", async () => {
  await page.goto("http://localhost:3000/app/call-summaries", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-call-summaries-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Caller").fill("Pat Lee");
  await page.getByLabel("What was said / needed").fill("AC not cooling, needs morning appointment");
  await page.getByRole("button", { name: "Summarize call" }).click();
  await page.waitForSelector("text=What they need");
  await page.screenshot({ path: `${shots}/e2e-calls.png`, fullPage: true });
});

await check("knowledge-upload", async () => {
  await page.goto("http://localhost:3000/app/knowledge", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-knowledge-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.setInputFiles('input[type="file"]', {
    name: "return-policy.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 test"),
  });
  await page.waitForSelector("text=return-policy.pdf");
  await page.screenshot({ path: `${shots}/e2e-knowledge.png`, fullPage: true });
});

await check("computer-audit", async () => {
  await page.goto("http://localhost:3000/app/computer", { waitUntil: "networkidle" });
  await page.getByRole("banner").getByRole("button", { name: "Review audit log" }).click();
  await page.waitForSelector("text=Computer control audit log");
  await page.getByRole("button", { name: "Grant desktop control" }).click();
  await page.getByRole("button", { name: "Run selected task" }).click();
  await page.waitForSelector("text=Finished", { timeout: 15000 });
  await page.screenshot({ path: `${shots}/e2e-computer-audit.png`, fullPage: true });
});

writeFileSync("/tmp/ops-smoke.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
if (results.some((r) => !r.ok)) process.exit(1);
