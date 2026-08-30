import { describe, expect, it } from "vitest";
import { runFoundationTests } from "../src/lib/domain/foundation-tests";

describe("Atlas foundation", () => {
  it("covers authz, validation, persistence, and typed actions", () => {
    const results = runFoundationTests();
    const failed = results.filter((row) => !row.ok);
    expect(failed, failed.map((row) => `${row.name}: ${row.detail}`).join("\n")).toEqual([]);
  });
});
