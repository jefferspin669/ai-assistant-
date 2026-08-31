"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  addWorkLocation,
  employeeLocationViews,
  loadWorkLocations,
  type WorkLocation,
} from "@/lib/workforce-locations";
import { loadTeamMembers, seedDemoTeamIfEmpty } from "@/lib/user-workspace";

export function WorkforceMapStudio() {
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [views, setViews] = useState(employeeLocationViews());
  const [name, setName] = useState("");
  const [kind, setKind] = useState<WorkLocation["kind"]>("office");
  const [address, setAddress] = useState("");

  const refresh = useCallback(() => {
    seedDemoTeamIfEmpty();
    setLocations(loadWorkLocations());
    setViews(employeeLocationViews());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function onAddLocation(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addWorkLocation(name, kind, address);
    setName("");
    setAddress("");
    refresh();
  }

  return (
    <div className="training-studio">
      <section className="panel employee-hero-card">
        <div>
          <p className="briefing-kicker">Workforce map</p>
          <h2>Real locations and assignments — not fake pre-populated staff.</h2>
          <p style={{ color: "rgba(244,248,247,0.8)" }}>
            Offices, stores, warehouses, and job sites from your data. Status shows assigned location and today&apos;s work —
            not constant GPS unless you enable field tracking with disclosure.
          </p>
        </div>
      </section>

      <section className="panel">
        <h2>Add location</h2>
        <form className="form-grid" onSubmit={onAddLocation}>
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chicago Office" /></label>
          <label>
            Type
            <select value={kind} onChange={(e) => setKind(e.target.value as WorkLocation["kind"])}>
              <option value="office">Office</option>
              <option value="store">Store</option>
              <option value="warehouse">Warehouse</option>
              <option value="jobsite">Job site</option>
              <option value="territory">Territory</option>
            </select>
          </label>
          <label>Address<input value={address} onChange={(e) => setAddress(e.target.value)} /></label>
          <button className="btn btn-dark" type="submit">+ Add location</button>
        </form>
      </section>

      {locations.length ? (
        <section className="panel">
          <h2>Sites</h2>
          <div className="pack-grid dense">
            {locations.map((l) => (
              <div className="domain-card" key={l.id}>
                <strong>{l.name}</strong>
                <span className="badge ok">{l.kind}</span>
                {l.address ? <small className="muted-line">{l.address}</small> : null}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="muted-line">Add offices, stores, or job sites — employees appear when assigned from Workforce.</p>
      )}

      <section className="panel">
        <h2>Employees</h2>
        <div className="list">
          {views.map((v) => (
            <div className="compliance-row" key={v.member.id}>
              <div>
                <p><strong>{v.member.name}</strong></p>
                <p className="muted-line">Assigned: {v.assignedLocation}</p>
                <p className="muted-line">Today: {v.todayJobSite}</p>
                <p>Status: {v.statusLabel}</p>
              </div>
              <Link className="btn btn-outline" href={`/app/messages?to=${encodeURIComponent(v.member.id)}`}>
                Message
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
