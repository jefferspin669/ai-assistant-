import { describe, expect, it } from "vitest";
import { loadCompanyModel } from "../src/lib/business-engine";
import { parseReceiptText, createPurchaseFromReceipt } from "../src/lib/expenses-workspace";
import {
  parseReceiptInventoryLines,
  inventoryIntelligence,
  loadInventoryItems,
} from "../src/lib/inventory-workspace";

describe("inventory workspace", () => {
  it("parses printer paper from receipt text", () => {
    const lines = parseReceiptInventoryLines("Office Depot\n20 boxes printer paper\n$840");
    expect(lines).toHaveLength(1);
    expect(lines[0].itemName).toBe("Printer Paper");
    expect(lines[0].quantity).toBe(20);
    expect(lines[0].unit).toBe("boxes");
  });

  it("seeds printer paper with min and reorder levels", () => {
    const paper = loadInventoryItems().find((i) => i.name === "Printer Paper");
    expect(paper?.quantity).toBe(14);
    expect(paper?.minimumStock).toBe(10);
    expect(paper?.reorderQuantity).toBe(20);
    expect(paper?.unit).toBe("cases");
  });

  it("builds intelligence for stock outlook", () => {
    const intel = inventoryIntelligence();
    expect(intel.some((r) => r.itemName === "Printer Paper")).toBe(true);
    expect(intel.length).toBeGreaterThan(0);
  });

  it("links purchase receipt to inventory lines", () => {
    const scan = parseReceiptText("Office Depot\n$840.00\n20 boxes printer paper");
    const purchase = createPurchaseFromReceipt(
      scan,
      "emp-1",
      "Marcus Johnson",
      "Office Renovation",
      "20 boxes printer paper",
    );
    expect(purchase.inventoryLines?.[0]?.quantity).toBe(20);
    expect(purchase.inventoryLines?.[0]?.itemName).toBe("Printer Paper");
  });

  it("feeds inventory costs into business engine model defaults", () => {
    const model = loadCompanyModel();
    expect(model.capacity).toContain("stock on hand");
    expect(model.customNotes.toLowerCase()).toContain("inventory");
  });
});
