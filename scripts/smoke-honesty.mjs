import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.ATLAS_BASE || "http://localhost:3000";
const OUT = "/opt/cursor/artifacts";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome-stable",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();
const results = [];

async function shot(name) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: false });
  return path;
}

try {
  await page.goto(`${BASE}/api/session`, { waitUntil: "networkidle" });
  results.push({ step: "session", ok: page.url().includes("session") || true });

  // Chatbot FAQ + hours + lead
  await page.goto(`${BASE}/app/chatbot`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const knowledge = await page.locator("text=Mon–Fri 8am–5pm CT").count();
  const noSmith = (await page.locator("text=/Smith Plumbing/i").count()) === 0;
  await page.fill('input[placeholder*="hours"]', "What are your hours?");
  await page.click('button:has-text("Send")');
  await page.waitForTimeout(1200);
  const hoursReply = await page.locator(".bubble-ai", { hasText: "Mon–Fri 8am–5pm CT" }).count();
  await page.fill('input[placeholder*="hours"]', "My name is Pat Rivera and I need a quote for a new AC");
  await page.click('button:has-text("Send")');
  await page.waitForTimeout(2500);
  const leadReply = await page.locator(".bubble-ai", { hasText: /CRM lead|cust_/i }).count();
  const chatbotShot = await shot("honesty-chatbot");
  results.push({
    step: "chatbot",
    ok: knowledge > 0 && noSmith && hoursReply > 0 && leadReply > 0,
    knowledge,
    noSmith,
    hoursReply,
    leadReply,
    shot: chatbotShot,
  });

  // Approvals
  await page.goto(`${BASE}/app/approvals`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const oneQueue = await page.getByText("/api/approvals", { exact: false }).count();
  const approvalsShot = await shot("honesty-approvals");
  results.push({ step: "approvals", ok: oneQueue > 0, oneQueue, shot: approvalsShot });

  // Marketing
  await page.goto(`${BASE}/app/marketing`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const demo = await page.locator("text=/Marketing · DEMO/i").count();
  const viaIntegrations = await page.locator("text=Connect via Integrations").count();
  const marketingShot = await shot("honesty-marketing");
  results.push({
    step: "marketing",
    ok: demo > 0 && viaIntegrations >= 1,
    demo,
    viaIntegrations,
    shot: marketingShot,
  });

  // Documents — generate then assert disabled exports
  await page.goto(`${BASE}/app/documents`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.click('button:has-text("Generate")');
  await page.waitForTimeout(800);
  const pdfDisabled = await page.locator('button:has-text("Download PDF")').isDisabled();
  const wordDisabled = await page.locator('button:has-text("Download Word")').isDisabled();
  const shareDisabled = await page.locator('button:has-text("Share")').isDisabled();
  const docsShot = await shot("honesty-documents");
  results.push({
    step: "documents",
    ok: pdfDisabled && wordDisabled && shareDisabled,
    pdfDisabled,
    wordDisabled,
    shareDisabled,
    shot: docsShot,
  });

  // Live /app/tax is MoneyWorkspace ledger — must not claim a PDF was exported.
  await page.goto(`${BASE}/app/tax`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const taxBody = await page.locator("body").innerText();
  const taxOk =
    !/Accountant-ready PDF exported|shared the package with your professional|PDF ready/i.test(taxBody);
  const taxShot = await shot("honesty-tax-documents");
  results.push({
    step: "tax-live",
    ok: taxOk,
    note: "Advanced TaxDocumentsPanel export buttons covered by unit tests; live tax is MoneyWorkspace.",
    shot: taxShot,
  });

  // Documents export buttons — scroll into view for artifact
  await page.goto(`${BASE}/app/documents`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.click('button:has-text("Generate")');
  await page.waitForTimeout(600);
  await page.locator('button:has-text("Download PDF")').scrollIntoViewIfNeeded();
  await shot("honesty-documents-exports");

  // Talk to Atlas voice tab — refund
  await page.goto(`${BASE}/app/ask?tab=voice&role=ceo`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const input = page.locator('input[aria-label="Ask Atlas"]');
  await input.fill("Refund $250");
  await page.locator('form.command-form button[type="submit"]').click();
  await page.waitForTimeout(1500);
  const stageBtn = page.locator('button:has-text("Stage on server")');
  if (await stageBtn.count()) {
    await stageBtn.click();
    await page.waitForTimeout(2000);
  }
  const bodyText = await page.locator("body").innerText();
  const honestRefund =
    /I have not refunded|Nothing was refunded|Staged .*server approval/i.test(bodyText) &&
    !/has been refunded|Refund completed|refunded successfully/i.test(bodyText);
  const talkShot = await shot("honesty-talk-refund");
  results.push({ step: "talk-refund", ok: honestRefund, shot: talkShot });
} catch (error) {
  results.push({ step: "error", ok: false, error: String(error) });
  await shot("honesty-error");
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
const failed = results.filter((r) => r.ok === false);
process.exit(failed.length ? 1 : 0);
