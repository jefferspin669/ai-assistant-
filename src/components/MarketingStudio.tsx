"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "@/components/SiteLink";
import {
  campaignSummary,
  createCampaign,
  loadCampaigns,
  loadConnectedAccounts,
  marketingDataMode,
  saveConnectedAccounts,
  type MarketingCampaign,
} from "@/lib/marketing-workspace";

export function MarketingStudio() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [accounts, setAccounts] = useState(loadConnectedAccounts());
  const [name, setName] = useState("Fall service reminder");
  const [channel, setChannel] = useState<MarketingCampaign["channel"]>("email");
  const [audience, setAudience] = useState("Customers — no visit in 90 days");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setCampaigns(loadCampaigns());
  }, []);

  const summary = campaignSummary();
  const mode = marketingDataMode();

  function toggleAccount(id: string) {
    const next = accounts.map((a) => (a.id === id ? { ...a, connected: !a.connected } : a));
    setAccounts(next);
    saveConnectedAccounts(next);
    setNote(next.some((a) => a.connected) ? "Account connected (demo) — metrics will show LIVE when APIs sync." : "Disconnected.");
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    createCampaign({ name, channel, audience });
    setCampaigns(loadCampaigns());
    setNote(`Campaign "${name}" created. Targeting syncs with CRM when connected.`);
  }

  return (
    <div className="training-studio">
      <div className="memory-card">
        <div className="label">Marketing · {mode}</div>
        <p>{summary.note}</p>
        {summary.totalRevenue != null ? (
          <p><strong>Attributed revenue: ${summary.totalRevenue.toLocaleString()}</strong></p>
        ) : null}
      </div>

      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      <section className="panel">
        <h2>Connected accounts</h2>
        <div className="list">
          {accounts.map((a) => (
            <div key={a.id} className="compliance-row">
              <div>
                <p><strong>{a.name}</strong></p>
                <p className="muted-line">{a.kind}</p>
              </div>
              <button className="btn btn-outline" type="button" onClick={() => toggleAccount(a.id)}>
                {a.connected ? "Connected" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Build campaign</h2>
        <form className="form-grid" onSubmit={onCreate}>
          <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>
            Channel
            <select value={channel} onChange={(e) => setChannel(e.target.value as MarketingCampaign["channel"])}>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="social">Social</option>
              <option value="post">Scheduled post</option>
            </select>
          </label>
          <label>Audience<input value={audience} onChange={(e) => setAudience(e.target.value)} /></label>
          <button className="btn btn-dark" type="submit">Create campaign</button>
        </form>
        <p className="muted-line">
          Audiences pull from <Link href="/app/customers">CRM</Link> and <Link href="/app/sales">Sales</Link> pipeline when connected.
        </p>
      </section>

      <section className="panel">
        <h2>Campaigns</h2>
        {campaigns.length === 0 ? (
          <p className="muted-line">No campaigns yet.</p>
        ) : (
          <div className="list">
            {campaigns.map((c) => (
              <div key={c.id} className="list-row">
                <span className="badge">{c.channel}</span>
                <p>
                  <strong>{c.name}</strong> · {c.status} · {c.audience}
                  {c.opens != null ? <span className="muted-line"> · {c.opens} opens · {c.clicks ?? 0} clicks</span> : null}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
