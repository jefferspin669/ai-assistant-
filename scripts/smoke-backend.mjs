import { chromium } from "playwright";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

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

await check("health-api", async () => {
  const res = await fetch("http://localhost:3000/api/health");
  const json = await res.json();
  if (!json.ok || json.data?.status !== "ok") throw new Error(JSON.stringify(json));
  if (!String(json.data.persistence).includes("file")) throw new Error("expected file persistence");
});

await check("workspace-roundtrip", async () => {
  const payload = [{ id: "smoke-1", title: "Backend smoke note", kind: "note" }];
  const put = await fetch("http://localhost:3000/api/workspace/notes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  const putJson = await put.json();
  if (!putJson.ok) throw new Error(JSON.stringify(putJson));
  const get = await fetch("http://localhost:3000/api/workspace/notes");
  const getJson = await get.json();
  if (!getJson.ok || getJson.data.data?.[0]?.title !== "Backend smoke note") {
    throw new Error(JSON.stringify(getJson));
  }
  const disk = join(process.cwd(), ".data", "workspace.json");
  if (!existsSync(disk)) throw new Error("workspace.json missing on disk");
  const file = JSON.parse(readFileSync(disk, "utf8"));
  if (!file.domains?.notes) throw new Error("notes domain not on disk");
});

await check("tasks-api", async () => {
  const create = await fetch("http://localhost:3000/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "API smoke task", notes: "from smoke" }),
  });
  const created = await create.json();
  if (!created.ok) throw new Error(JSON.stringify(created));
  const list = await fetch("http://localhost:3000/api/tasks");
  const listed = await list.json();
  if (!listed.ok || !listed.data.some((t) => t.title === "API smoke task")) {
    throw new Error(JSON.stringify(listed));
  }
  if (!existsSync(join(process.cwd(), ".data", "atlas-db.json"))) {
    throw new Error("atlas-db.json missing");
  }
});

await check("files-http-ui", async () => {
  await page.goto("http://localhost:3000/app/files", { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill("Smoke backend file");
  await page.getByLabel("Content").fill("Persisted via /api/files/upload");
  await page.getByRole("button", { name: "Save to backend" }).click();
  await page.waitForSelector("text=Smoke backend file");
  await page.screenshot({ path: `${shots}/e2e-backend-files.png`, fullPage: true });
});

await check("backend-page", async () => {
  await page.goto("http://localhost:3000/app/backend", { waitUntil: "networkidle" });
  await page.waitForSelector("text=Atlas Backend");
  await page.getByRole("button", { name: "Create API task" }).click();
  await page.waitForSelector("text=Created task");
  await page.getByRole("button", { name: "Write workspace note" }).click();
  await page.waitForSelector("text=Workspace notes domain written");
  await page.screenshot({ path: `${shots}/e2e-backend-page.png`, fullPage: true });
});

await check("tasks-ui-sync", async () => {
  await page.goto("http://localhost:3000/app/tasks", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const title = `Smoke sync ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: /Add task|Save|Create/i }).first().click();
  await page.waitForTimeout(1000);
  const get = await fetch("http://localhost:3000/api/workspace/tasks");
  const json = await get.json();
  const found = Array.isArray(json.data?.data) && json.data.data.some((t) => t.title === title);
  if (!found) throw new Error(`task not synced to workspace: ${JSON.stringify(json).slice(0, 400)}`);
  await page.screenshot({ path: `${shots}/e2e-backend-tasks.png`, fullPage: true });
});

await check("ai-chat-http", async () => {
  await page.goto("http://localhost:3000/app/chat", { waitUntil: "networkidle" });
  await page.getByPlaceholder("Ask Atlas…").fill("How is business?");
  await page.getByRole("button", { name: "Send" }).click();
  await page.waitForSelector("text=Saved to Conversations");
  await page.screenshot({ path: `${shots}/e2e-backend-chat.png`, fullPage: true });
});

writeFileSync("/tmp/backend-smoke.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
if (results.some((r) => !r.ok)) process.exit(1);
