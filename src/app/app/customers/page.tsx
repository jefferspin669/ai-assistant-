"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { crmPredictions } from "@/lib/atlas-platform";
import {
  createCrmCustomer,
  loadCrmCustomers,
  saveCrmCustomers,
  type CrmCustomer,
} from "@/lib/surface-workspace";

function CrmStudio() {
  const [customers, setCustomers] = useState<CrmCustomer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [jobs, setJobs] = useState("0");
  const [value, setValue] = useState("$0");
  const [last, setLast] = useState("Just added");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadCrmCustomers();
    setCustomers(loaded);
    setSelectedId(loaded[0]?.id ?? null);
    setShowForm(loaded.length === 0);
    setReady(true);
  }, []);

  const selected = customers.find((c) => c.id === selectedId) ?? null;

  function persist(next: CrmCustomer[], selectId?: string | null) {
    setCustomers(next);
    saveCrmCustomers(next);
    if (selectId !== undefined) setSelectedId(selectId);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const customer = createCrmCustomer({
      name,
      phone,
      email,
      jobs: Number(jobs) || 0,
      value,
      last,
      notes,
    });
    const next = [customer, ...customers];
    persist(next, customer.id);
    setShowForm(false);
    setEditing(false);
    setName("");
    setPhone("");
    setEmail("");
    setJobs("0");
    setValue("$0");
    setLast("Just added");
    setNotes("");
    setNote(`Added ${customer.name}.`);
  }

  function beginEdit() {
    if (!selected) return;
    setEditing(true);
    setName(selected.name);
    setPhone(selected.phone);
    setEmail(selected.email);
    setJobs(String(selected.jobs));
    setValue(selected.value);
    setLast(selected.last);
    setNotes(selected.notes);
    setShowForm(true);
  }

  function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    const updated: CrmCustomer = {
      ...selected,
      name: name.trim() || selected.name,
      phone: phone.trim(),
      email: email.trim(),
      jobs: Number(jobs) || 0,
      value: value.trim() || "$0",
      last: last.trim() || selected.last,
      notes: notes.trim(),
    };
    persist(
      customers.map((c) => (c.id === selected.id ? updated : c)),
      updated.id,
    );
    setShowForm(false);
    setEditing(false);
    setNote(`Updated ${updated.name}.`);
  }

  function removeCustomer(id: string) {
    const next = customers.filter((c) => c.id !== id);
    persist(next, next[0]?.id ?? null);
    if (next.length === 0) setShowForm(true);
    setNote("Customer removed.");
  }

  return (
    <div className="training-studio">
      {(showForm || customers.length === 0) && (
        <section className="panel">
          <h2>{editing ? "Edit customer" : "Add customer"}</h2>
          <form className="form-grid" onSubmit={editing ? onSaveEdit : onCreate}>
            <label>
              Name
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>
              Phone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Jobs
              <input type="number" min={0} value={jobs} onChange={(e) => setJobs(e.target.value)} />
            </label>
            <label>
              Value
              <input value={value} onChange={(e) => setValue(e.target.value)} />
            </label>
            <label>
              Last activity
              <input value={last} onChange={(e) => setLast(e.target.value)} />
            </label>
            <label>
              Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </label>
            <button className="btn btn-dark" type="submit">
              {editing ? "Save changes" : "Add customer"}
            </button>
            {customers.length > 0 ? (
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(false);
                }}
              >
                Cancel
              </button>
            ) : null}
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
            <button
              className="btn btn-dark"
              type="button"
              onClick={() => {
                setEditing(false);
                setName("");
                setPhone("");
                setEmail("");
                setJobs("0");
                setValue("$0");
                setLast("Just added");
                setNotes("");
                setShowForm(true);
              }}
            >
              Add customer
            </button>
          </div>
          {!ready ? <p className="muted-line">Loading…</p> : null}
          {ready && customers.length === 0 ? (
            <p className="muted-line">No customers yet. Add your first profile.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Jobs</th>
                    <th>Value</th>
                    <th>Last activity</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr
                      key={c.id}
                      className={selectedId === c.id ? "row-active" : undefined}
                      onClick={() => setSelectedId(c.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{c.name}</td>
                      <td>{c.jobs}</td>
                      <td>{c.value}</td>
                      <td>{c.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <div className="list">
                <div className="list-row">
                  <span className="badge">Phone</span>
                  <p>{selected.phone || "—"}</p>
                </div>
                <div className="list-row">
                  <span className="badge">Email</span>
                  <p>{selected.email || "—"}</p>
                </div>
                <div className="list-row">
                  <span className="badge">Jobs</span>
                  <p>
                    {selected.jobs} · {selected.value}
                  </p>
                </div>
                <div className="list-row">
                  <span className="badge">Last</span>
                  <p>{selected.last}</p>
                </div>
              </div>
              {selected.notes ? (
                <div className="memory-card" style={{ marginTop: "1rem" }}>
                  <div className="label">Notes</div>
                  <p>{selected.notes}</p>
                </div>
              ) : null}
              <div className="train-actions">
                <button className="btn btn-dark" type="button" onClick={beginEdit}>
                  Edit
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => removeCustomer(selected.id)}
                >
                  Remove
                </button>
              </div>
            </>
          ) : (
            <p className="muted-line">Select a customer to edit.</p>
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
                <p>
                  <strong>{item.customer}</strong> — {item.signal}
                </p>
                <small className="muted-line">{item.action}</small>
                <div className="memory-card" style={{ marginTop: "0.55rem" }}>
                  <p>{item.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <AppShell
      title="AI CRM"
      subtitle="Add and edit customers — Atlas still predicts who needs attention and what to say."
    >
      <CrmStudio />
    </AppShell>
  );
}
