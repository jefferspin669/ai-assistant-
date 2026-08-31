"use client";

import Link from "@/components/SiteLink";
import { EmptyState } from "@/components/EmptyState";
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addInventoryItem,
  adjustInventory,
  inventoryIntelligence,
  loadInventoryItems,
  loadStockMovements,
  stockIn,
  stockOut,
  transferInventory,
  useInventory,
  type InventoryItem,
  type StockMovement,
} from "@/lib/inventory-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty } from "@/lib/user-workspace";
import { isDemoWorkspace } from "@/lib/workspace-mode";

type Tab = "items" | "movements" | "intelligence" | "use";

function InventoryStudioInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: Tab =
    tabParam === "movements" || tabParam === "intelligence" || tabParam === "use" ? tabParam : "items";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [moves, setMoves] = useState<StockMovement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [addName, setAddName] = useState("Printer Paper");
  const [addSku, setAddSku] = useState("");
  const [addCategory, setAddCategory] = useState("Office supplies");
  const [addQty, setAddQty] = useState("14");
  const [addUnit, setAddUnit] = useState("cases");
  const [addCost, setAddCost] = useState("42");
  const [addPrice, setAddPrice] = useState("58");
  const [addSupplier, setAddSupplier] = useState("Supply House A");
  const [addLocation, setAddLocation] = useState("Warehouse");
  const [addMin, setAddMin] = useState("10");
  const [addReorder, setAddReorder] = useState("20");

  const [useQty, setUseQty] = useState("3");
  const [useProject, setUseProject] = useState("Office Renovation");
  const [useEmployeeId, setUseEmployeeId] = useState("");
  const [moveQty, setMoveQty] = useState("5");
  const [transferTo, setTransferTo] = useState("Office");

  const refresh = useCallback(() => {
    setItems(loadInventoryItems());
    setMoves(loadStockMovements());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const members = loadTeamMembers();
    const marcus = members.find((m) => m.name.toLowerCase().includes("marcus"));
    setUseEmployeeId(marcus?.id ?? members[0]?.id ?? "");
    refresh();
    const first = loadInventoryItems()[0];
    if (first) setSelectedId(first.id);
  }, [refresh]);

  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const intel = useMemo(() => inventoryIntelligence(), [items, moves]);

  function onAddItem(e: FormEvent) {
    e.preventDefault();
    addInventoryItem({
      name: addName.trim(),
      sku: addSku.trim() || `SKU-${Date.now().toString(36).slice(2, 6)}`,
      category: addCategory,
      quantity: Number(addQty) || 0,
      unit: addUnit,
      cost: Number(addCost) || 0,
      salePrice: Number(addPrice) || 0,
      supplier: addSupplier,
      location: addLocation,
      minimumStock: Number(addMin) || 0,
      reorderQuantity: Number(addReorder) || 0,
    });
    refresh();
    setNote(`Added ${addName.trim()} to inventory.`);
  }

  function onUse(e: FormEvent) {
    e.preventDefault();
    if (!selected || !useEmployeeId) return;
    const member = loadTeamMembers().find((m) => m.id === useEmployeeId);
    if (!member) return;
    const qty = Number(useQty) || 0;
    useInventory(selected.id, qty, member.id, member.name, useProject);
    refresh();
    setNote(`${member.name} used ${qty} ${selected.unit} — ${new Date().toLocaleTimeString()}.`);
  }

  return (
    <div className="training-studio">
      <div className="training-tabs" role="tablist">
        {(["items", "use", "movements", "intelligence"] as Tab[]).map((t) => (
          <a key={t} href={`/app/inventory?tab=${t}`} className={tab === t ? "training-tab active" : "training-tab"}>
            {t === "items" ? "Items" : t === "use" ? "Use inventory" : t === "movements" ? "History" : "Intelligence"}
          </a>
        ))}
      </div>

      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      {tab === "items" ? (
        <>
          {items.length === 0 && !isDemoWorkspace() ? (
            <EmptyState
              title="Inventory isn't configured yet"
              description="Add inventory manually, import a spreadsheet, or connect your inventory provider."
              actions={[
                { label: "Add item", href: "/app/inventory?tab=items", primary: true },
                { label: "Scan purchase receipt", href: "/app/purchasing?tab=scan" },
                { label: "Connect provider", href: "/app/connections" },
              ]}
            />
          ) : null}
          <section className="panel">
            <h2>+ Add item</h2>
            <form className="form-grid" onSubmit={onAddItem}>
              <label>Item name<input value={addName} onChange={(e) => setAddName(e.target.value)} /></label>
              <label>SKU / barcode<input value={addSku} onChange={(e) => setAddSku(e.target.value)} /></label>
              <label>Category<input value={addCategory} onChange={(e) => setAddCategory(e.target.value)} /></label>
              <label>Quantity<input type="number" value={addQty} onChange={(e) => setAddQty(e.target.value)} /></label>
              <label>Unit<input value={addUnit} onChange={(e) => setAddUnit(e.target.value)} /></label>
              <label>Cost<input type="number" value={addCost} onChange={(e) => setAddCost(e.target.value)} /></label>
              <label>Sale price<input type="number" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} /></label>
              <label>Supplier<input value={addSupplier} onChange={(e) => setAddSupplier(e.target.value)} /></label>
              <label>Location<input value={addLocation} onChange={(e) => setAddLocation(e.target.value)} /></label>
              <label>Minimum stock<input type="number" value={addMin} onChange={(e) => setAddMin(e.target.value)} /></label>
              <label>Reorder qty<input type="number" value={addReorder} onChange={(e) => setAddReorder(e.target.value)} /></label>
              <button className="btn btn-dark" type="submit">Add item</button>
            </form>
          </section>
          <div className="split">
            <section className="panel">
              <h2>Stock</h2>
              <div className="list">
                {items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={selectedId === item.id ? "compliance-row active" : "compliance-row"}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div>
                      <p><strong>{item.name}</strong></p>
                      <small className="muted-line">
                        Current: {item.quantity} {item.unit} · Min: {item.minimumStock} · Reorder: {item.reorderQuantity}
                      </small>
                    </div>
                    {item.quantity <= item.minimumStock ? <span className="badge warn">Low</span> : null}
                  </button>
                ))}
              </div>
            </section>
            {selected ? (
              <section className="panel">
                <h2>{selected.name}</h2>
                <p className="panel-lead">{selected.quantity} {selected.unit} at {selected.location}</p>
                <div className="cta-row">
                  <button className="btn btn-outline" type="button" onClick={() => { stockIn(selected.id, Number(moveQty) || 1); refresh(); setNote(`Stock in +${moveQty}`); }}>+ Stock in</button>
                  <button className="btn btn-outline" type="button" onClick={() => { stockOut(selected.id, Number(moveQty) || 1); refresh(); setNote(`Stock out -${moveQty}`); }}>- Stock out</button>
                  <button className="btn btn-outline" type="button" onClick={() => { transferInventory(selected.id, Number(moveQty) || 1, selected.location, transferTo); setNote(`Transferred to ${transferTo}`); refresh(); }}>Transfer</button>
                  <button className="btn btn-outline" type="button" onClick={() => { const n = Number(addQty); adjustInventory(selected.id, n, "Manual adjust"); refresh(); setNote(`Adjusted to ${n}`); }}>Adjust</button>
                </div>
                <label style={{ marginTop: "0.75rem" }}>Quantity<input value={moveQty} onChange={(e) => setMoveQty(e.target.value)} /></label>
                <label>Transfer to<input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} /></label>
              </section>
            ) : null}
          </div>
        </>
      ) : null}

      {tab === "use" && selected ? (
        <section className="panel">
          <h2>Use inventory</h2>
          <p className="panel-lead">Employees log usage — stock updates automatically.</p>
          <form className="form-grid" onSubmit={onUse}>
            <label>
              Item
              <select value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</option>
                ))}
              </select>
            </label>
            <label>
              Employee
              <select value={useEmployeeId} onChange={(e) => setUseEmployeeId(e.target.value)}>
                {loadTeamMembers().map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>Quantity<input value={useQty} onChange={(e) => setUseQty(e.target.value)} /></label>
            <label>Project<input value={useProject} onChange={(e) => setUseProject(e.target.value)} /></label>
            <button className="btn btn-dark" type="submit">Use inventory</button>
          </form>
        </section>
      ) : null}

      {tab === "movements" ? (
        <section className="panel">
          <h2>Movement history</h2>
          <div className="list">
            {moves.map((m) => (
              <div key={m.id} className="list-row">
                <span className="badge">{m.type.replace("_", " ")}</span>
                <p>
                  <strong>{m.itemName}</strong> · {m.quantity}
                  {m.employeeName ? ` — ${m.employeeName}` : ""}
                  {m.project ? ` · ${m.project}` : ""}
                  <span className="muted-line">{new Date(m.at).toLocaleString()}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "intelligence" ? (
        <section className="panel">
          <h2>Automatic inventory intelligence</h2>
          {intel.map((row) => (
            <div key={row.id} className="memory-card" style={{ marginBottom: "0.75rem" }}>
              <div className="label">{row.itemName}</div>
              <p><strong>{row.message}</strong></p>
              <p className="muted-line">{row.detail}</p>
              <Link className="btn btn-outline" href="/app/purchasing?tab=scan">Create purchase order</Link>
            </div>
          ))}
          <p className="muted-line">
            Business Engine uses inventory costs in projections —{" "}
            <Link href="/app/business-engine?tab=overview">open Business Engine</Link>.
          </p>
        </section>
      ) : null}
    </div>
  );
}

export function InventoryStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading inventory…</p>}>
      <InventoryStudioInner />
    </Suspense>
  );
}
