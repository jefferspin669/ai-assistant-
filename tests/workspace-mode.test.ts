import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  activateProductionWorkspace,
  enterPreviewWorkspace,
  isDemoWorkspace,
  isProductionWorkspace,
  loadWorkspaceMode,
} from "../src/lib/workspace-mode";
import { loadInventoryItems } from "../src/lib/inventory-workspace";
import { loadOpportunities } from "../src/lib/sales-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty } from "../src/lib/user-workspace";

function mockLocalStorage() {
  const store: Record<string, string> = {};
  const storage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { localStorage: storage });
}

describe("workspace mode", () => {
  beforeEach(() => {
    mockLocalStorage();
  });

  it("defaults to production with empty data", () => {
    expect(loadWorkspaceMode()).toBe("production");
    expect(isProductionWorkspace()).toBe(true);
    expect(loadInventoryItems()).toEqual([]);
    expect(loadOpportunities()).toEqual([]);
    expect(seedDemoTeamIfEmpty()).toEqual([]);
  });

  it("preview mode seeds demo inventory only in preview", () => {
    enterPreviewWorkspace();
    expect(isDemoWorkspace()).toBe(true);
    const paper = loadInventoryItems().find((i) => i.name === "Printer Paper");
    expect(paper?.quantity).toBe(14);
  });

  it("activation wipes demo data and locks production", () => {
    enterPreviewWorkspace();
    seedDemoTeamIfEmpty();
    expect(loadTeamMembers().length).toBeGreaterThan(0);
    activateProductionWorkspace({
      companyName: "Summit HVAC",
      industry: "HVAC",
      locations: 1,
      teamSize: "5",
      businessHours: "8–5",
      ownerName: "Owner",
    });
    expect(isProductionWorkspace()).toBe(true);
    expect(loadInventoryItems()).toEqual([]);
    expect(loadTeamMembers()).toEqual([]);
  });
});
