"use client";

import Link from "@/components/SiteLink";
import { EmptyState } from "@/components/EmptyState";
import { FormEvent, Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  addRouteStop,
  loadRoutePlan,
  loadRouteStops,
  mapPosition,
  optimizeRoute,
  removeRouteStop,
  trafficMultiplier,
  type RoutePlan,
  type RouteStop,
} from "@/lib/routes-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty } from "@/lib/user-workspace";
import { isDemoWorkspace } from "@/lib/workspace-mode";

function RouteMap({ stops }: { stops: RouteStop[] }) {
  return (
    <div
      className="route-map-panel"
      style={{
        position: "relative",
        height: "280px",
        borderRadius: "12px",
        background:
          "linear-gradient(160deg, #e8f0f8 0%, #d4e4f0 40%, #c5d9e8 100%)",
        border: "1px solid var(--border, #ccc)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.35,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 39px, #9ab 39px, #9ab 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #9ab 39px, #9ab 40px)",
        }}
      />
      {stops.map((stop, i) => {
        const { x, y } = mapPosition(stop);
        return (
          <div
            key={stop.id}
            title={`${stop.label} — ${stop.address}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: i === 0 ? "#1a1a1a" : "#2563eb",
              color: "#fff",
              fontSize: "12px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
              zIndex: 2,
            }}
          >
            {i}
          </div>
        );
      })}
      <span
        className="muted-line"
        style={{ position: "absolute", bottom: 8, left: 12, fontSize: "11px" }}
      >
        Live map · traffic ×{trafficMultiplier().toFixed(2)} (simulated)
      </span>
    </div>
  );
}

function RoutesStudioInner() {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [plan, setPlan] = useState<RoutePlan | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setStops(loadRouteStops());
    setPlan(loadRoutePlan());
  }, []);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const members = loadTeamMembers();
    setEmployeeId(members[0]?.id ?? "");
    refresh();
  }, [refresh]);

  function onOptimize() {
    if (!employeeId) return;
    const result = optimizeRoute(employeeId, Number(capacity) || 8);
    setPlan(result);
    setNote(
      `Atlas optimized ${result.stops.length - 1} stops · ${result.totalDriveMinutes} min drive · ~${result.milesSaved} mi saved vs naive order.`,
    );
    refresh();
  }

  function onAddStop(e: FormEvent) {
    e.preventDefault();
    if (!label.trim() || !address.trim()) return;
    addRouteStop({
      label: label.trim(),
      address: address.trim(),
      lat: 40.71 + Math.random() * 0.02,
      lng: -74.01 - Math.random() * 0.02,
      priority: 2,
      windowStart: "09:00",
      windowEnd: "17:00",
      units: 1,
    });
    setLabel("");
    setAddress("");
    refresh();
    setNote("Stop added — run Optimize to reorder.");
  }

  const displayStops = plan?.stops ?? stops;

  return (
    <div className="training-studio">
      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      {stops.length === 0 && !isDemoWorkspace() ? (
        <EmptyState
          title="No routes configured"
          description="Add stops manually or pull jobs from CRM and projects once connected."
          actions={[
            { label: "Add first stop", href: "/app/routes", primary: true },
            { label: "Open CRM", href: "/app/customers" },
            { label: "Open projects", href: "/app/projects" },
          ]}
        />
      ) : null}

      <div className="split">
        <section className="panel">
          <h2>Route map</h2>
          <RouteMap stops={displayStops} />
          <div className="form-grid" style={{ marginTop: "1rem" }}>
            <label>
              Driver
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                {loadTeamMembers().map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label>
              Vehicle capacity (units)
              <input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </label>
            <button className="btn btn-dark" type="button" onClick={onOptimize}>
              Optimize route
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Stops</h2>
          <div className="list">
            {displayStops.map((stop, i) => (
              <div key={stop.id} className="compliance-row">
                <div>
                  <p>
                    <strong>{i}. {stop.label}</strong>
                    {stop.eta ? ` · ETA ${stop.eta}` : ""}
                    {stop.driveMinutes ? ` · ${stop.driveMinutes} min drive` : ""}
                  </p>
                  <p className="muted-line">{stop.address}</p>
                  <p className="muted-line">
                    Window {stop.windowStart}–{stop.windowEnd} · Priority {stop.priority} · {stop.units} units
                  </p>
                </div>
                {stop.priority > 0 ? (
                  <button className="ghost-link" type="button" onClick={() => { removeRouteStop(stop.id); refresh(); }}>
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h2>+ Add stop</h2>
        <form className="form-grid" onSubmit={onAddStop}>
          <label>Label<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Job or delivery" /></label>
          <label>Address<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city" /></label>
          <button className="btn btn-outline" type="submit">Add stop</button>
        </form>
        <p className="muted-line">
          Pull from <Link href="/app/customers">CRM</Link> or <Link href="/app/projects">projects</Link> — add addresses manually until job sync is connected.
        </p>
      </section>
    </div>
  );
}

export function RoutesStudio() {
  return (
    <Suspense fallback={<p className="muted-line">Loading routes…</p>}>
      <RoutesStudioInner />
    </Suspense>
  );
}
