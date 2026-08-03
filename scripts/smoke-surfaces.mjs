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

await check("meetings", async () => {
  await page.goto("http://localhost:3000/app/meetings", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-meetings-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("form").getByLabel("Title").fill("Ops standup");
  await page.locator("form").getByRole("button", { name: "Add meeting", exact: true }).click();
  await page.getByRole("link", { name: "Open meeting page" }).click();
  await page.waitForURL(/\/app\/meetings\//);
  await page.getByRole("button", { name: "Start meeting" }).click();
  await page.waitForSelector("text=Live");
  await page.screenshot({ path: `${shots}/e2e-meetings.png`, fullPage: true });
});

await check("vision", async () => {
  await page.goto("http://localhost:3000/app/vision", { waitUntil: "networkidle" });
  await page.getByRole("banner").getByRole("button", { name: "Upload photo" }).click();
  await page.getByRole("button", { name: "Upload file" }).waitFor();
  await page.getByRole("button", { name: "Take picture" }).waitFor();
  // Simulate file upload via hidden input
  await page.setInputFiles('input[type="file"]:not([capture])', {
    name: "hvac-unit.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from(
      "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEBAVFRUVFRUVFRUVFRUVFRUWFxUVFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMtNygtLisBCgoKDg0OGxAQGy0lHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAACAwEBAQAAAAAAAAAAAAADBAECBQYAB//EADUQAAIBAwMCBAMFBQEAAAAAAAECAwAEERIhMQVBEyJRYXGBFDKRobHB0eHwFSNCYv/EABkBAAMBAQEAAAAAAAAAAAAAAAABAgMEBf/EACIRAAICAgICAwEAAAAAAAAAAAABAhEDIRIxBEFREyJh/9oADAMBAAIRAxEAPwD1TRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjRjR//2Q==",
      "base64",
    ),
  });
  await page.waitForSelector("text=This capacitor looks damaged");
  await page.screenshot({ path: `${shots}/e2e-vision.png`, fullPage: true });
});

await check("timeline", async () => {
  await page.goto("http://localhost:3000/app/timeline", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-timeline-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("Entry").fill("Customer asked for morning window");
  await page.getByRole("button", { name: "Add to timeline" }).click();
  await page.waitForSelector("text=Customer asked for morning window");
  await page.getByRole("button", { name: "Edit" }).click();
  await page.locator("form").filter({ hasText: "Save" }).getByRole("textbox").fill("Customer prefers mornings");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForSelector("text=Customer prefers mornings");
  await page.screenshot({ path: `${shots}/e2e-timeline.png`, fullPage: true });
});

await check("crm", async () => {
  await page.goto("http://localhost:3000/app/customers", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-crm-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("form").first().getByLabel("Name").fill("Taylor Reed");
  await page.locator("form").first().getByLabel("Phone").fill("(555) 111-2222");
  await page.locator("form").first().getByRole("button", { name: "Add customer", exact: true }).click();
  await page.waitForSelector("text=Taylor Reed");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.locator("form").first().getByLabel("Value").fill("$900");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForSelector("text=$900");
  await page.screenshot({ path: `${shots}/e2e-crm.png`, fullPage: true });
});

await check("security-lock", async () => {
  await page.goto("http://localhost:3000/app/security", { waitUntil: "networkidle" });
  await page.getByRole("banner").getByRole("button", { name: "Lock sensitive actions" }).click();
  await page.waitForSelector("text=Sensitive actions locked");
  await page.getByRole("tab", { name: /Approvals/ }).waitFor();
  await page.screenshot({ path: `${shots}/e2e-security-lock.png`, fullPage: true });
});

await check("security-add", async () => {
  await page.goto("http://localhost:3000/app/security", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-security-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Add security item" }).click();
  await page.getByLabel("Event").fill("Export payroll CSV");
  await page.getByRole("button", { name: "Add item" }).click();
  await page.waitForSelector("text=Export payroll CSV");
  await page.screenshot({ path: `${shots}/e2e-security-add.png`, fullPage: true });
});

await check("os-add", async () => {
  await page.goto("http://localhost:3000/app/os", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.removeItem("atlas-user-os-apps-v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByLabel("App name").fill("Fleet tracker");
  await page.getByLabel("Detail").fill("Vehicles and fuel");
  await page.getByRole("button", { name: "Add app" }).click();
  await page.waitForSelector("text=Fleet tracker");
  await page.screenshot({ path: `${shots}/e2e-os.png`, fullPage: true });
});

writeFileSync("/tmp/surface-smoke.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
if (results.some((r) => !r.ok)) process.exit(1);
