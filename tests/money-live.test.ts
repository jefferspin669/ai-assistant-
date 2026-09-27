import { beforeEach, describe, expect, it } from "vitest";
import { resetDatabase } from "../src/lib/db/store";
import { database, testSession } from "../src/lib/services/access";
import { createOrgTransaction, listOrgTransactions } from "../src/lib/services/workspace";
import { runAtlasBrain } from "../src/lib/brain";

describe("real money ledger and grounded advice", () => {
  beforeEach(() => resetDatabase());

  it("records an actual workspace entry and rejects unauthorized money writes", () => {
    const db = database();
    const owner = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const manager = testSession(db.users[0]!.id, db.organizations[0]!.id, "manager");
    const entry = createOrgTransaction(owner, {
      kind: "income", label: "Paid in person", amount: 120, date: "2026-09-27",
    });
    expect(listOrgTransactions(owner).find((row) => row.id === entry.id)?.provenance).toBe("LIVE");
    expect(() => createOrgTransaction(manager, { kind: "income", label: "Unauthorized", amount: 1, date: "2026-09-27" })).toThrow();
  });

  it("does not substitute canned invoice claims for authenticated advice", async () => {
    const db = database();
    const owner = testSession(db.users[0]!.id, db.organizations[0]!.id, "owner");
    const result = await runAtlasBrain({ message: "How should I improve the server?", session: owner });
    if (result.mode === "simulation") {
      expect(result.reply).not.toContain("Three overdue invoices");
      expect(result.reply).not.toMatch(/Nina Alvarez|Harbor Dental/);
    }
  });
});
