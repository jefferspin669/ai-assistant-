import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

const CONSOLIDATED = [
  ["src/app/app/brain/page.tsx", "/app/ask"],
  ["src/app/app/voice/page.tsx", "/app/ask?tab=voice"],
  ["src/app/app/meetings/page.tsx", "/app/appointments"],
  ["src/app/app/employees/page.tsx", "/app/workforce?tab=ai-workers"],
  ["src/app/app/teams/page.tsx", "/app/workforce?tab=team"],
  ["src/app/app/security/page.tsx", "/app/governance"],
  ["src/app/app/capital/page.tsx", "/app/money"],
  ["src/app/app/digital-twin/page.tsx", "/app/business-engine?tab=simulate"],
  ["src/app/app/analytics/page.tsx", "/app"],
  ["src/app/app/dna/page.tsx", "/app/memory"],
  ["src/app/app/knowledge/page.tsx", "/app/files"],
] as const;

describe("product consolidation redirects", () => {
  it("keeps duplicate studios as redirect stubs", () => {
    for (const [rel, dest] of CONSOLIDATED) {
      const source = readFileSync(path.join(ROOT, rel), "utf8");
      expect(source).toContain("redirect(");
      expect(source).toContain(dest);
    }
  });

  it("registers Phase 1 consolidations in next.config", () => {
    const config = readFileSync(path.join(ROOT, "next.config.ts"), "utf8");
    expect(config).toContain('source: "/app/brain"');
    expect(config).toContain('destination: "/app/ask"');
    expect(config).not.toContain('source: "/app/missed-calls"');
    expect(config).not.toContain('source: "/app/call-summaries"');
  });

  it("shows setup requirements for phone surfaces instead of fabricated data", () => {
    const missed = readFileSync(path.join(ROOT, "src/app/app/missed-calls/page.tsx"), "utf8");
    const summaries = readFileSync(path.join(ROOT, "src/app/app/call-summaries/page.tsx"), "utf8");
    expect(missed).toContain("No calls to show");
    expect(missed).toContain("/app/connections");
    expect(summaries).toContain("No call summaries yet");
    expect(summaries).toContain("/app/connections");
  });
});
