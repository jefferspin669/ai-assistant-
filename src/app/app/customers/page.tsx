"use client";

import { FormEvent, useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CrmTimelinePanel } from "@/components/CrmTimelinePanel";
import { crmPredictions } from "@/lib/atlas-platform";
import {
  CONTACT_METHODS,
  CONTACTS_ABILITIES,
  contactsPermFor,
  createCrmCustomer,
  CUSTOMER_TYPES,
  loadCrmCustomers,
  saveCrmCustomers,
  setContactsPerm,
  type ContactsAbility,
  type ContactsPerm,
  type CrmCustomer,
} from "@/lib/surface-workspace";
import { loadTeamMembers, seedDemoTeamIfEmpty, type TeamPerson } from "@/lib/user-workspace";

type FormState = {
  firstName: string;
  lastName: string;
  businessName: string;
  mobile: string;
  workPhone: string;
  homePhone: string;
  email: string;
  secondaryEmail: string;
  address: string;
  preferredContact: string;
  customerType: string;
  tags: string;
  notes: string;
  assignedEmployee: string;
  leadSource: string;
  importantDates: string;
};

const EMPTY: FormState = {
  firstName: "",
  lastName: "",
  businessName: "",
  mobile: "",
  workPhone: "",
  homePhone: "",
  email: "",
  secondaryEmail: "",
  address: "",
  preferredContact: "",
  customerType: "",
  tags: "",
  notes: "",
  assignedEmployee: "",
  leadSource: "",
  importantDates: "",
};

function CrmStudio() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "timeline" ? "timeline" : "profile";
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [members, setMembers] = useState<TeamPerson[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showPerms, setShowPerms] = useState(false);
  const [viewAsId, setViewAsId] = useState("");
  const [permTick, setPermTick] = useState(0);

  useEffect(() => {
    seedDemoTeamIfEmpty();
    const loaded = loadCrmCustomers();
    setCustomers(loaded);
    setMembers(loadTeamMembers());
    setSelectedId(loaded[0]?.id ?? null);
    setShowForm(loaded.length === 0);
    setReady(true);
  }, []);

  const selected = customers.find((c) => c.id === selectedId) ?? null;
  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  // Effective permissions: the owner has full access; "View as" previews what a
  // specific employee is allowed to do based on the company's Contacts policy.
  const FULL: ContactsPerm = { memberId: "owner", view: true, add: true, edit: true, export: true, delete: true };
  const perm = useMemo<ContactsPerm>(() => {
    const m = members.find((x) => x.id === viewAsId);
    return m ? contactsPermFor(m) : FULL;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAsId, members, permTick]);

  function togglePerm(member: TeamPerson, ability: ContactsAbility, value: boolean) {
    setContactsPerm(member, ability, value);
    setPermTick((n) => n + 1);
  }

  function exportContacts() {
    if (!perm.export) return;
    const cols = ["Name", "Business", "Mobile", "Work", "Home", "Email", "Secondary email", "Address", "Type", "Assigned", "Lead source", "Tags", "Notes"];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const rows = customers.map((c) =>
      [c.name, c.businessName ?? "", c.mobile ?? c.phone ?? "", c.workPhone ?? "", c.homePhone ?? "", c.email ?? "", c.secondaryEmail ?? "", c.address ?? "", c.customerType ?? "", c.assignedEmployee ?? "", c.leadSource ?? "", (c.tags ?? []).join("; "), c.notes ?? ""].map(esc).join(","),
    );
    const csv = [cols.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
    setNote(`Exported ${customers.length} contact${customers.length === 1 ? "" : "s"} to CSV.`);
  }
  const hasName = useMemo(
    () => Boolean(form.firstName.trim() || form.lastName.trim() || form.businessName.trim()),
    [form.firstName, form.lastName, form.businessName],
  );

  function persist(next: CrmCustomer[], selectId?: string | null) {
    setCustomers(next);
    saveCrmCustomers(next);
    if (selectId !== undefined) setSelectedId(selectId);
  }

  function openAdd() {
    if (!perm.add) return;
    setEditing(false);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!hasName) {
      setError("Enter at least a first name, last name, or business name.");
      return;
    }
    const customer = createCrmCustomer({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) });
    persist([customer, ...customers], customer.id);
    setShowForm(false);
    setForm(EMPTY);
    setError("");
    setNote(`Added ${customer.name}.`);
  }

  function beginEdit() {
    if (!selected || !perm.edit) return;
    setEditing(true);
    setForm({
      firstName: selected.firstName ?? "",
      lastName: selected.lastName ?? "",
      businessName: selected.businessName ?? "",
      mobile: selected.mobile ?? selected.phone ?? "",
      workPhone: selected.workPhone ?? "",
      homePhone: selected.homePhone ?? "",
      email: selected.email ?? "",
      secondaryEmail: selected.secondaryEmail ?? "",
      address: selected.address ?? "",
      preferredContact: selected.preferredContact ?? "",
      customerType: selected.customerType ?? "",
      tags: (selected.tags ?? []).join(", "),
      notes: selected.notes ?? "",
      assignedEmployee: selected.assignedEmployee ?? "",
      leadSource: selected.leadSource ?? "",
      importantDates: selected.importantDates ?? "",
    });
    setError("");
    setShowForm(true);
  }

  function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!hasName) {
      setError("Enter at least a first name, last name, or business name.");
      return;
    }
    const rebuilt = createCrmCustomer({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) });
    const updated: CrmCustomer = { ...rebuilt, id: selected.id, createdAt: selected.createdAt, jobs: selected.jobs, value: selected.value, last: selected.last };
    persist(customers.map((c) => (c.id === selected.id ? updated : c)), updated.id);
    setShowForm(false);
    setEditing(false);
    setNote(`Updated ${updated.name}.`);
  }

  function removeCustomer(id: string) {
    if (!perm.delete) return;
    const next = customers.filter((c) => c.id !== id);
    persist(next, next[0]?.id ?? null);
    if (next.length === 0) setShowForm(true);
    setNote("Customer removed.");
  }

  return (
    <div className="training-studio">
      <div className="training-tabs" role="tablist">
        <a href="/app/customers" className={tab === "profile" ? "training-tab active" : "training-tab"}>Profiles</a>
        <a href="/app/customers?tab=timeline" className={tab === "timeline" ? "training-tab active" : "training-tab"}>Timeline</a>
      </div>

      {tab === "timeline" ? (
        <section className="panel">
          <h2>Customer timeline</h2>
          <CrmTimelinePanel customer={selected} />
        </section>
      ) : null}

      {tab === "profile" ? (
        <>
      <section className="panel">
        <div className="train-head">
          <div>
            <h2>Contacts permissions</h2>
            <p className="panel-lead">Decide exactly which employees can view, add, edit, export, or delete customer contact information.</p>
          </div>
          <button className="btn btn-outline" type="button" onClick={() => setShowPerms((v) => !v)}>
            {showPerms ? "Hide" : "Manage permissions"}
          </button>
        </div>
        {showPerms ? (
          members.length === 0 ? (
            <p className="muted-line">No employees yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    {CONTACTS_ABILITIES.map((a) => <th key={a.id} style={{ textAlign: "center" }}>{a.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => {
                    const p = contactsPermFor(m);
                    return (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong><span className="muted-line" style={{ display: "block" }}>{m.role}</span></td>
                        {CONTACTS_ABILITIES.map((a) => (
                          <td key={a.id} style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={p[a.id]}
                              aria-label={`${m.name} can ${a.label.toLowerCase()} contacts`}
                              onChange={(e) => togglePerm(m, a.id, e.target.checked)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : null}
        <div className="field-row" style={{ marginTop: "0.6rem", alignItems: "flex-end" }}>
          <label style={{ maxWidth: "22rem" }}>
            Preview access as
            <select value={viewAsId} onChange={(e) => setViewAsId(e.target.value)}>
              <option value="">Owner (full access)</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.role}</option>)}
            </select>
          </label>
          <p className="muted-line" style={{ margin: 0 }}>
            {viewAsId
              ? `This employee can: ${CONTACTS_ABILITIES.filter((a) => perm[a.id]).map((a) => a.label).join(", ") || "nothing"}.`
              : "You have full access to contacts."}
          </p>
        </div>
      </section>

      {(showForm || customers.length === 0) && (editing ? perm.edit : perm.add) && (
        <section className="panel">
          <h2>{editing ? "Edit customer" : "Add customer"}</h2>
          <p className="panel-lead">Only a name or business name is required — add whatever else you have.</p>
          <form className="form-grid" onSubmit={editing ? onSaveEdit : onCreate}>
            <div className="field-row">
              <label>First name<input value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} /></label>
              <label>Last name<input value={form.lastName} onChange={(e) => set({ lastName: e.target.value })} /></label>
            </div>
            <label>Business name<input value={form.businessName} onChange={(e) => set({ businessName: e.target.value })} placeholder="e.g. Johnson Construction" /></label>
            <div className="field-row">
              <label>Mobile number<input value={form.mobile} onChange={(e) => set({ mobile: e.target.value })} /></label>
              <label>Work number<input value={form.workPhone} onChange={(e) => set({ workPhone: e.target.value })} /></label>
              <label>Home number<input value={form.homePhone} onChange={(e) => set({ homePhone: e.target.value })} /></label>
            </div>
            <div className="field-row">
              <label>Email<input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} /></label>
              <label>Secondary email<input type="email" value={form.secondaryEmail} onChange={(e) => set({ secondaryEmail: e.target.value })} /></label>
            </div>
            <label>Address<input value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Street, city, state" /></label>
            <div className="field-row">
              <label>
                Preferred contact method
                <select value={form.preferredContact} onChange={(e) => set({ preferredContact: e.target.value })}>
                  <option value="">—</option>
                  {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label>
                Customer type
                <select value={form.customerType} onChange={(e) => set({ customerType: e.target.value })}>
                  <option value="">—</option>
                  {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </div>
            <label>Tags<input value={form.tags} onChange={(e) => set({ tags: e.target.value })} placeholder="comma,separated,tags" /></label>
            <div className="field-row">
              <label>
                Assigned employee
                <select value={form.assignedEmployee} onChange={(e) => set({ assignedEmployee: e.target.value })}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </label>
              <label>Lead source<input value={form.leadSource} onChange={(e) => set({ leadSource: e.target.value })} placeholder="e.g. Referral, Google, Walk-in" /></label>
            </div>
            <label>Birthday / important dates<input value={form.importantDates} onChange={(e) => set({ importantDates: e.target.value })} placeholder="Optional" /></label>
            <label>Notes<textarea value={form.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} /></label>
            {error ? <p className="auth-error">{error}</p> : null}
            <div className="train-actions">
              <button className="btn btn-dark" type="submit" disabled={!hasName}>
                {editing ? "Save changes" : "+ Add Customer"}
              </button>
              {customers.length > 0 ? (
                <button className="btn btn-outline" type="button" onClick={() => { setShowForm(false); setEditing(false); setError(""); }}>Cancel</button>
              ) : null}
            </div>
          </form>
        </section>
      )}

      <div className="split">
        <section className="panel">
          <div className="train-head">
            <div>
              <h2>Customers</h2>
              <p className="panel-lead">Add and edit profiles — Atlas still predicts who needs attention.</p>
            </div>
            <div className="train-actions">
              {perm.export ? (
                <button className="btn btn-outline" type="button" onClick={exportContacts} disabled={!perm.view || customers.length === 0}>Export</button>
              ) : null}
              {perm.add ? (
                <button className="btn btn-dark" type="button" onClick={openAdd}>Add customer</button>
              ) : null}
            </div>
          </div>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && !perm.view ? (
            <p className="muted-line">🔒 You don&apos;t have permission to view customer contacts.</p>
          ) : ready && customers.length === 0 ? (
            <p className="muted-line">No customers yet. Add your first profile.</p>
          ) : !perm.view ? null : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Assigned</th>
                    <th>Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className={selectedId === c.id ? "row-active" : undefined} onClick={() => setSelectedId(c.id)} style={{ cursor: "pointer" }}>
                      <td>{c.name}</td>
                      <td>{c.customerType || "—"}</td>
                      <td>{c.assignedEmployee || "—"}</td>
                      <td>{c.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          {!perm.view ? (
            <p className="muted-line">🔒 Contact details are hidden for your role.</p>
          ) : selected ? (
            <>
              <h2>{selected.name}</h2>
              {selected.tags && selected.tags.length ? (
                <div className="status-picker" style={{ marginBottom: "0.5rem" }}>
                  {selected.tags.map((t) => <span key={t} className="badge">{t}</span>)}
                </div>
              ) : null}
              <div className="list">
                {selected.businessName && (selected.firstName || selected.lastName) ? (
                  <div className="list-row"><span className="badge">Contact</span><p>{`${selected.firstName ?? ""} ${selected.lastName ?? ""}`.trim()}</p></div>
                ) : null}
                <div className="list-row"><span className="badge">Mobile</span><p>{selected.mobile || "—"}</p></div>
                <div className="list-row"><span className="badge">Work</span><p>{selected.workPhone || "—"}</p></div>
                <div className="list-row"><span className="badge">Home</span><p>{selected.homePhone || "—"}</p></div>
                <div className="list-row"><span className="badge">Email</span><p>{selected.email || "—"}{selected.secondaryEmail ? ` · ${selected.secondaryEmail}` : ""}</p></div>
                <div className="list-row"><span className="badge">Address</span><p>{selected.address || "—"}</p></div>
                <div className="list-row"><span className="badge">Prefers</span><p>{selected.preferredContact || "—"}</p></div>
                <div className="list-row"><span className="badge">Type</span><p>{selected.customerType || "—"}</p></div>
                <div className="list-row"><span className="badge">Assigned</span><p>{selected.assignedEmployee || "Unassigned"}</p></div>
                <div className="list-row"><span className="badge">Lead source</span><p>{selected.leadSource || "—"}</p></div>
                <div className="list-row"><span className="badge">Dates</span><p>{selected.importantDates || "—"}</p></div>
              </div>
              {selected.notes ? (
                <div className="memory-card" style={{ marginTop: "1rem" }}>
                  <div className="label">Notes</div>
                  <p>{selected.notes}</p>
                </div>
              ) : null}
              {perm.edit || perm.delete ? (
                <div className="train-actions">
                  {perm.edit ? <button className="btn btn-dark" type="button" onClick={beginEdit}>Edit</button> : null}
                  {perm.delete ? <button className="btn btn-outline" type="button" onClick={() => removeCustomer(selected.id)}>Remove</button> : null}
                </div>
              ) : null}
            </>
          ) : (
            <p className="muted-line">Select a customer to see details.</p>
          )}
          {note ? <p className="muted-line" style={{ marginTop: "0.85rem" }}>{note}</p> : null}
        </section>
      </div>

      <section className="panel">
        <h2>Predictive outreach</h2>
        <div className="list">
          {crmPredictions.map((item) => (
            <div className="list-row" key={item.customer}>
              <span className="badge warn">Signal</span>
              <div>
                <p><strong>{item.customer}</strong> — {item.signal}</p>
                <small className="muted-line">{item.action}</small>
                <div className="memory-card" style={{ marginTop: "0.55rem" }}>
                  <p>{item.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
        </>
      ) : null}
    </div>
  );
}

function CustomersPageInner() {
  return (
    <AppShell
      title="CRM"
      subtitle="Customers, full timeline, and relationship intelligence — calls, messages, purchases, appointments, and more."
    >
      <CrmStudio />
    </AppShell>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<AppShell title="CRM" subtitle="Loading…"><p className="muted-line">Loading…</p></AppShell>}>
      <CustomersPageInner />
    </Suspense>
  );
}
