import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");

const CONSOLIDATED = [
  ["src/app/app/missed-calls/page.tsx", "/app/commercial"],
  ["src/app/app/brain/page.tsx", "/app/ask"],
  ["src/app/app/voice/page.tsx", "/app/ask?tab=voice"],
  ["src/app/app/meetings/page.tsx", "/app/appointments"],
  ["src/app/app/employees/page.tsx", "/app/workforce?tab=ai-workers"],
  ["src/app/app/teams/page.tsx", "/app/workforce?tab=team"],
  ["src/app/app/security/page.tsx", "/app/governance"],
  ["src/app/app/capital/page.tsx", "/app/money"],
  ["src/app/app/digital-twin/page.tsx", "/app/business-engine?tab=simulate"],
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
    expect(config).toContain('source: "/app/missed-calls"');
    expect(config).toContain('source: "/app/brain"');
    expect(config).toContain('destination: "/app/commercial"');
  });
});
