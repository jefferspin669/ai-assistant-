/** Inventory workspace — stock tracking, movements, intelligence, purchase integration. */

import { isDemoWorkspace } from "@/lib/workspace-mode";

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  cost: number;
  salePrice: number;
  supplier: string;
  location: string;
  minimumStock: number;
  reorderQuantity: number;
  createdAt: string;
};

export type StockMovementType = "stock_in" | "stock_out" | "transfer" | "adjust";

export type StockMovement = {
  id: string;
  itemId: string;
  itemName: string;
  type: StockMovementType;
  quantity: number;
  employeeId?: string;
  employeeName?: string;
  project?: string;
  fromLocation?: string;
  toLocation?: string;
  note?: string;
  at: string;
};

export type InventoryIntelligence = {
  id: string;
  itemId: string;
  itemName: string;
  kind: "stockout" | "usage_spike" | "reorder";
  message: string;
  detail: string;
};

const ITEMS_KEY = "atlas-inventory-items-v1";
const MOVES_KEY = "atlas-inventory-moves-v1";

const SEED_ITEMS: InventoryItem[] = [
  {
    id: "inv-paper",
    name: "Printer Paper",
    sku: "PPR-20",
    category: "Office supplies",
    quantity: 14,
    unit: "cases",
    cost: 42,
    salePrice: 58,
    supplier: "Supply House A",
    location: "Warehouse",
    minimumStock: 10,
    reorderQuantity: 20,
    createdAt: nowIso(),
  },
];

export function loadInventoryItems(): InventoryItem[] {
  const saved = loadJson<InventoryItem[]>(ITEMS_KEY, []);
  if (saved.length) return saved;
  return isDemoWorkspace() ? SEED_ITEMS : [];
}

export function saveInventoryItems(items: InventoryItem[]) {
  saveJson(ITEMS_KEY, items);
}

export function loadStockMovements(): StockMovement[] {
  return loadJson<StockMovement[]>(MOVES_KEY, []).sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function saveStockMovements(moves: StockMovement[]) {
  saveJson(MOVES_KEY, moves);
}

export function addInventoryItem(input: Omit<InventoryItem, "id" | "createdAt">): InventoryItem {
  const item: InventoryItem = {
    ...input,
    id: newId("inv"),
    createdAt: nowIso(),
  };
  saveInventoryItems([item, ...loadInventoryItems()]);
  return item;
}

function appendMovement(move: Omit<StockMovement, "id" | "at">) {
  const entry: StockMovement = { ...move, id: newId("mv"), at: nowIso() };
  saveStockMovements([entry, ...loadStockMovements()]);
  return entry;
}

function updateItemQuantity(itemId: string, delta: number) {
  const items = loadInventoryItems();
  const next = items.map((i) => (i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i));
  saveInventoryItems(next);
  return next.find((i) => i.id === itemId);
}

export function stockIn(itemId: string, quantity: number, note?: string, employeeName?: string) {
  const item = loadInventoryItems().find((i) => i.id === itemId);
  if (!item || quantity <= 0) return null;
  updateItemQuantity(itemId, quantity);
  return appendMovement({
    itemId,
    itemName: item.name,
    type: "stock_in",
    quantity,
    employeeName,
    note,
  });
}

export function stockOut(itemId: string, quantity: number, note?: string) {
  const item = loadInventoryItems().find((i) => i.id === itemId);
  if (!item || quantity <= 0) return null;
  updateItemQuantity(itemId, -quantity);
  return appendMovement({
    itemId,
    itemName: item.name,
    type: "stock_out",
    quantity,
    note,
  });
}

export function useInventory(
  itemId: string,
  quantity: number,
  employeeId: string,
  employeeName: string,
  project?: string,
) {
  const item = loadInventoryItems().find((i) => i.id === itemId);
  if (!item || quantity <= 0) return null;
  updateItemQuantity(itemId, -quantity);
  return appendMovement({
    itemId,
    itemName: item.name,
    type: "stock_out",
    quantity,
    employeeId,
    employeeName,
    project,
    note: `${employeeName} used ${quantity} ${item.unit}`,
  });
}

export function transferInventory(itemId: string, quantity: number, fromLocation: string, toLocation: string) {
  const item = loadInventoryItems().find((i) => i.id === itemId);
  if (!item || quantity <= 0) return null;
  return appendMovement({
    itemId,
    itemName: item.name,
    type: "transfer",
    quantity,
    fromLocation,
    toLocation,
    note: `Transferred ${quantity} ${item.unit}`,
  });
}

export function adjustInventory(itemId: string, newQuantity: number, note?: string) {
  const items = loadInventoryItems();
  const item = items.find((i) => i.id === itemId);
  if (!item) return null;
  const delta = newQuantity - item.quantity;
  saveInventoryItems(items.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)));
  return appendMovement({
    itemId,
    itemName: item.name,
    type: "adjust",
    quantity: Math.abs(delta),
    note: note ?? `Adjusted to ${newQuantity}`,
  });
}

export function monthlyUsageAverage(itemId: string): number {
  const moves = loadStockMovements().filter((m) => m.itemId === itemId && m.type === "stock_out");
  if (!moves.length) return 0;
  const total = moves.reduce((s, m) => s + m.quantity, 0);
  return Math.max(1, Math.round(total / 3));
}

export function estimateStockOutDate(item: InventoryItem): string | null {
  const avg = monthlyUsageAverage(item.id);
  if (avg <= 0 || item.quantity <= 0) return null;
  const daysLeft = Math.floor((item.quantity / avg) * 30);
  const d = new Date();
  d.setDate(d.getDate() + daysLeft);
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

export function inventoryIntelligence(): InventoryIntelligence[] {
  const items = loadInventoryItems();
  const out: InventoryIntelligence[] = [];
  for (const item of items) {
    const avg = monthlyUsageAverage(item.id);
    if (item.quantity <= item.minimumStock) {
      out.push({
        id: `low-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        kind: "reorder",
        message: `${item.name} below minimum (${item.quantity} ${item.unit})`,
        detail: `Reorder ${item.reorderQuantity} ${item.unit} from ${item.supplier}.`,
      });
    }
    const stockOut = estimateStockOutDate(item);
    if (stockOut && avg > 0) {
      out.push({
        id: `out-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        kind: "stockout",
        message: `${item.name} averages ~${avg} ${item.unit}/month`,
        detail: `Current: ${item.quantity}. Estimated stock-out: ${stockOut}.`,
      });
    }
  }
  const paper = items.find((i) => i.name.toLowerCase().includes("paper"));
  if (paper) {
    out.push({
      id: "usage-paper",
      itemId: paper.id,
      itemName: paper.name,
      kind: "usage_spike",
      message: "Inventory usage may increase with active projects",
      detail: "Track project-linked usage in movement history.",
    });
  }
  return out;
}

export function inventoryCostSummary(): { totalValue: number; monthlyBurn: number } {
  const items = loadInventoryItems();
  const totalValue = items.reduce((s, i) => s + i.quantity * i.cost, 0);
  const moves = loadStockMovements().filter((m) => m.type === "stock_out");
  const monthlyBurn = moves.reduce((s, m) => {
    const item = items.find((i) => i.id === m.itemId);
    return s + m.quantity * (item?.cost ?? 0);
  }, 0);
  return { totalValue, monthlyBurn: Math.round(monthlyBurn / 3) };
}

export type ReceiptInventoryLine = {
  itemName: string;
  quantity: number;
  unit: string;
};

/** Detect inventory lines from receipt OCR text. */
export function parseReceiptInventoryLines(raw: string): ReceiptInventoryLine[] {
  const lines: ReceiptInventoryLine[] = [];
  const qtyMatch = raw.match(/(\d+)\s*(?:x|boxes?|cases?)?\s*(printer\s*paper|paper)/i);
  if (qtyMatch) {
    lines.push({
      itemName: "Printer Paper",
      quantity: Number(qtyMatch[1]),
      unit: /case/i.test(raw) ? "cases" : "boxes",
    });
  }
  const generic = raw.match(/(\d+)\s*x\s+([A-Za-z][A-Za-z\s]+)/i);
  if (generic && !qtyMatch) {
    lines.push({
      itemName: generic[2].trim(),
      quantity: Number(generic[1]),
      unit: "units",
    });
  }
  return lines;
}

export function addInventoryFromReceipt(
  itemName: string,
  quantity: number,
  unit: string,
  employeeName?: string,
): InventoryItem | null {
  const items = loadInventoryItems();
  const existing = items.find((i) => i.name.toLowerCase() === itemName.toLowerCase());
  if (existing) {
    stockIn(existing.id, quantity, `Added from purchase receipt`, employeeName);
    return loadInventoryItems().find((i) => i.id === existing.id) ?? existing;
  }
  const item = addInventoryItem({
    name: itemName,
    sku: newId("sku").slice(-8).toUpperCase(),
    category: "Purchased",
    quantity,
    unit,
    cost: 0,
    salePrice: 0,
    supplier: "Receipt",
    location: "Warehouse",
    minimumStock: 5,
    reorderQuantity: quantity,
  });
  appendMovement({
    itemId: item.id,
    itemName: item.name,
    type: "stock_in",
    quantity,
    employeeName,
    note: "Initial stock from receipt",
  });
  return item;
}

export function formatMovementTime(at: string): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
