"use client";

import { FormEvent, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useWorkspaceSession } from "@/lib/hooks/useWorkspaceSession";
import { atlasClient } from "@/lib/api/client";

export function CustomersStudio() {
  const { ctx, error: sessionError } = useWorkspaceSession();
  const { data, error, isLoading, refresh } = useCustomers(Boolean(ctx));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [flash, setFlash] = useState("");

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!ctx) return;
    const result = await atlasClient.customers.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
    });
    if (!result.success) {
      setFlash(result.error);
      return;
    }
    setName("");
    setEmail("");
    setPhone("");
    setFlash(`Saved ${result.data.name}.`);
    await refresh();
  }

  return (
    <AppShell
      title="Customers"
      subtitle="Org-scoped records from the Atlas API. Email and phone are optional."
    >
      {sessionError ? <p className="auth-error">{sessionError}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      {flash ? <p className="auth-success">{flash}</p> : null}

      <form className="form-grid" onSubmit={onCreate}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email (optional)
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Phone (optional)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <button className="btn btn-dark" type="submit" disabled={!ctx}>
          Add customer
        </button>
      </form>

      <section className="panel" style={{ marginTop: "1rem" }}>
        <h2>Directory</h2>
        {isLoading ? <p className="muted-line">Loading…</p> : null}
        <div className="list">
          {(data || []).map((customer) => (
            <div className="list-row" key={customer.id}>
              <span className={`badge${customer.provenance === "DEMO" ? "" : " ok"}`}>
                {customer.provenance || "LIVE"}
              </span>
              <p>
                <strong>{customer.name}</strong>
                <span className="muted-line">
                  {customer.email || "No email"} · {customer.phone || "No phone"} · {customer.status}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
