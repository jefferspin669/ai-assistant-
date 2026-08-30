import { chromium } from "playwright";

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

await check("events", async () => {
  await page.goto("http://localhost:3000/app/events", { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill("Birthday bash");
  await page.getByLabel("Guests").fill("40");
  await page.getByLabel("Budget ($)").fill("1000");
  await page.getByRole("button", { name: "Plan with Atlas" }).last().click();
  await page.waitForSelector("text=Birthday bash");
  await page.screenshot({ path: `${shots}/e2e-events.png`, fullPage: true });
});

await check("app-store", async () => {
  await page.goto("http://localhost:3000/app/app-store", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Name").first().fill("Test HVAC Tools");
  await page.getByRole("button", { name: "Add to App Store" }).click();
  await page.waitForSelector("text=Test HVAC Tools");
  await page.screenshot({ path: `${shots}/e2e-app-store.png`, fullPage: true });
});

await check("launch-goal", async () => {
  await page.goto("http://localhost:3000/app/employees", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Launch goal" }).click();
  await page.getByRole("tab", { name: "Run a goal" }).waitFor();
  const selected = await page.getByRole("tab", { name: "Run a goal" }).getAttribute("aria-selected");
  if (selected !== "true") throw new Error("Run a goal tab not selected after Launch goal");
  await page.getByRole("button", { name: "Launch", exact: true }).click();
  await page.waitForSelector("text=Create checklist");
  await page.screenshot({ path: `${shots}/e2e-launch-goal.png`, fullPage: true });
});

await check("coach", async () => {
  await page.goto("http://localhost:3000/app/coach", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "How do I refund this customer?" }).first().click();
  await page.waitForSelector("text=Payments → Refund");
  await page.screenshot({ path: `${shots}/e2e-coach.png`, fullPage: true });
});

await check("workflows", async () => {
  await page.goto("http://localhost:3000/app/workflows", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.removeItem("atlas-user-workflows-v1");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("banner").getByRole("button", { name: "New workflow" }).click();
  await page.waitForSelector("text=Blank automation created");
  await page.getByRole("button", { name: "+ Missed call" }).click();
  await page.waitForSelector(".workflow-step strong");
  await page.screenshot({ path: `${shots}/e2e-workflows.png`, fullPage: true });
});

await check("team", async () => {
  await page.goto("http://localhost:3000/app/team", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.removeItem("atlas-user-team-v1");
    localStorage.removeItem("atlas-user-team-tasks-v1");
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("form").getByLabel("Name").fill("Alex Test");
  await page.locator("form").getByLabel("Role").fill("Tech");
  await page.locator("form").getByRole("button", { name: "Invite employee" }).click();
  await page.getByRole("link", { name: "Open member page" }).click();
  await page.waitForURL(/\/app\/team\//);
  await page.getByLabel("Task").fill("Call customer");
  await page.getByRole("button", { name: /Add task/i }).click();
  await page.waitForSelector("text=Call customer");
  await page.screenshot({ path: `${shots}/e2e-team.png`, fullPage: true });
});

await check("language", async () => {
  await page.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
  await page.locator(".language-switcher select").selectOption("es");
  await page.waitForSelector("text=Panel");
  await page.screenshot({ path: `${shots}/e2e-language-es.png`, fullPage: true });
});

await check("industries", async () => {
  await page.goto("http://localhost:3000/app/industries", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-industry-packs-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add pack" }).first().click();
  await page.waitForSelector("text=Your packs (1)");
  await page.getByPlaceholder("Refund script").fill("Refund script");
  await page.locator("textarea").last().fill("Issue refund under policy");
  await page.getByRole("button", { name: "Add template" }).click();
  await page.waitForSelector("text=Issue refund under policy");
  await page.screenshot({ path: `${shots}/e2e-industries.png`, fullPage: true });
});

console.log(JSON.stringify(results, null, 2));
await browser.close();
if (results.some((r) => !r.ok)) process.exit(1);
