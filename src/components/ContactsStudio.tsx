"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  CONTACT_KINDS,
  createContact,
  filterContacts,
  loadContacts,
  removeContact,
  saveContacts,
  type ContactKind,
  type ContactRecord,
} from "@/lib/contacts";

export function ContactsStudio() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [kind, setKind] = useState<ContactKind | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({
    kind: "customer" as ContactKind,
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  useEffect(() => {
    const seeded = loadContacts();
    setContacts(seeded);
    setSelectedId(seeded[0]?.id || null);
  }, []);

  const filtered = useMemo(() => filterContacts(contacts, kind, query), [contacts, kind, query]);
  const selected = contacts.find((c) => c.id === selectedId) || filtered[0] || null;

  function persist(next: ContactRecord[], note: string) {
    saveContacts(next);
    setContacts(next);
    setMessage(note);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    const contact = createContact(draft);
    const next = [contact, ...contacts];
    persist(next, `Added ${contact.name}.`);
    setSelectedId(contact.id);
    setDraft({ kind: draft.kind, name: "", email: "", phone: "", company: "", notes: "" });
  }

  return (
    <AppShell
      title="Contacts"
      subtitle="Central address book for customers, employees, vendors, family, accountants, and partners."
    >
      <div className="cta-row" style={{ flexWrap: "wrap" }}>
        {CONTACT_KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`biz-chip ${kind === item.id ? "active" : ""}`}
            onClick={() => setKind(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="split contacts-layout">
        <section className="panel">
          <label className="form-grid">
            Search contacts
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, company…"
            />
          </label>
          <ul className="manage-list" style={{ marginTop: "1rem" }}>
            {filtered.map((contact) => (
              <li key={contact.id}>
                <button
                  type="button"
                  className={`ghost-link contact-pick ${selected?.id === contact.id ? "active" : ""}`}
                  onClick={() => setSelectedId(contact.id)}
                >
                  <strong>{contact.name}</strong>
                  <span>
                    {contact.kind} · {contact.company || contact.email || contact.phone || "No details"}
                  </span>
                </button>
              </li>
            ))}
            {!filtered.length ? <li className="muted">No contacts match.</li> : null}
          </ul>

          <form className="form-grid" style={{ marginTop: "1.25rem" }} onSubmit={onCreate}>
            <h3>Add contact</h3>
            <label>
              Type
              <select
                value={draft.kind}
                onChange={(e) => setDraft((d) => ({ ...d, kind: e.target.value as ContactKind }))}
              >
                {CONTACT_KINDS.filter((k) => k.id !== "all").map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Name
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Email
              <input
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
              />
            </label>
            <label>
              Phone
              <input
                value={draft.phone}
                onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              />
            </label>
            <label>
              Company
              <input
                value={draft.company}
                onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
              />
            </label>
            <label>
              Notes
              <textarea
                rows={3}
                value={draft.notes}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              />
            </label>
            <button className="btn btn-dark" type="submit">
              Save contact
            </button>
          </form>
        </section>

        <section className="panel">
          {selected ? (
            <>
              <p className="briefing-kicker">{selected.kind}</p>
              <h2>{selected.name}</h2>
              <p className="panel-lead">
                {[selected.company, selected.email, selected.phone].filter(Boolean).join(" · ") || "No contact details yet"}
              </p>
              {selected.notes ? <p>{selected.notes}</p> : null}
              {selected.tags.length ? (
                <div className="cta-row" style={{ margin: "0.75rem 0" }}>
                  {selected.tags.map((tag) => (
                    <span key={tag} className="biz-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="contact-linked">
                <div>
                  <h3>Conversations</h3>
                  <ul className="manage-list">
                    {selected.conversations.length ? (
                      selected.conversations.map((item) => (
                        <li key={item.id}>
                          <div>
                            <strong>{item.summary}</strong>
                            <span>{new Date(item.at).toLocaleString()}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="muted">No conversations linked.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3>Appointments</h3>
                  <ul className="manage-list">
                    {selected.appointments.length ? (
                      selected.appointments.map((item) => (
                        <li key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                            <span>{new Date(item.at).toLocaleString()}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="muted">No appointments linked.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3>Invoices</h3>
                  <ul className="manage-list">
                    {selected.invoices.length ? (
                      selected.invoices.map((item) => (
                        <li key={item.id}>
                          <div>
                            <strong>
                              {item.label} · ${item.amount.toFixed(2)}
                            </strong>
                            <span>{item.status}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="muted">No invoices linked.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3>Documents</h3>
                  <ul className="manage-list">
                    {selected.documents.length ? (
                      selected.documents.map((item) => (
                        <li key={item.id}>
                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.kind}</span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="muted">No documents linked.</li>
                    )}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline"
                style={{ marginTop: "1rem" }}
                onClick={() => {
                  const next = removeContact(contacts, selected.id);
                  persist(next, `Removed ${selected.name}.`);
                  setSelectedId(next[0]?.id || null);
                }}
              >
                Remove contact
              </button>
            </>
          ) : (
            <p className="panel-lead">Select a contact to see linked notes, conversations, appointments, invoices, and documents.</p>
          )}
        </section>
      </div>

      {message ? <p className="auth-success">{message}</p> : null}
    </AppShell>
  );
}
