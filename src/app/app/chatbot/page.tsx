"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiGet, apiSend } from "@/lib/backend/client";

type Msg = { role: "ai" | "user"; text: string };

type OrgSettings = {
  businessName: string;
  publicHours?: string | null;
  publicServices?: string | null;
  publicPricing?: string | null;
  publicAddress?: string | null;
};

type Customer = { id: string; name: string; status: string };

function answerFromSettings(q: string, settings: OrgSettings | null): string | null {
  const s = q.toLowerCase();
  if (s.includes("hour") || s.includes("open")) {
    return settings?.publicHours
      ? settings.publicHours
      : "Hours are not published in Settings yet. Ask the owner to add public hours, or leave your name for a callback.";
  }
  if (s.includes("price") || s.includes("cost") || s.includes("rate")) {
    return settings?.publicPricing
      ? settings.publicPricing
      : "Pricing is not published in Settings yet. I can create a lead so the business can quote you.";
  }
  if (s.includes("service") || s.includes("offer") || s.includes("do you")) {
    return settings?.publicServices
      ? settings.publicServices
      : "Services are not published in Settings yet. Tell me what you need and I can create a lead.";
  }
  if (s.includes("direction") || s.includes("where") || s.includes("address") || s.includes("located")) {
    return settings?.publicAddress
      ? settings.publicAddress
      : "An address is not published in Settings yet.";
  }
  return null;
}

export default function ChatbotPage() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      await fetch("/api/session").catch(() => undefined);
      const result = await apiGet<OrgSettings>("/api/settings");
      if (result.ok) {
        setSettings(result.data);
        setMessages([
          {
            role: "ai",
            text: `Hi — I’m the ${result.data.businessName} website assistant. Ask about hours, services, prices, or directions. If I can’t answer from published Settings, I can create a CRM lead.`,
          },
        ]);
      } else {
        setMessages([
          {
            role: "ai",
            text: "Hi — sign in so I can load this business’s published hours, services, and prices. I will not invent another company’s answers.",
          },
        ]);
        setStatus(result.error);
      }
    })();
  }, []);

  async function createLead(note: string) {
    const nameMatch = note.match(
      /(?:i(?:'m| am)|my name is)\s+([A-Za-z][A-Za-z'-]*(?:\s+[A-Za-z][A-Za-z'-]*){0,2})/i,
    );
    const name = nameMatch?.[1]?.trim() || "Website visitor";
    const result = await apiSend<Customer>("/api/customers", "POST", {
      name,
      status: "lead",
      email: undefined,
      phone: undefined,
    });
    if (!result.ok) {
      return `I could not create a lead on the server (${result.error}). Nothing was saved to CRM.`;
    }
    const verify = await apiGet<Customer[]>("/api/customers");
    const found = verify.ok && verify.data.some((row) => row.id === result.data.id);
    if (!found) {
      return "The server accepted a lead write, but I could not verify it in CRM yet — refresh Customers before assuming it exists.";
    }
    return `I created CRM lead “${result.data.name}” (${result.data.id}). Someone from ${settings?.businessName || "the business"} can follow up. Your note: “${note.slice(0, 200)}”.`;
  }

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    const direct = answerFromSettings(trimmed, settings);
    let reply: string;
    if (direct) {
      reply = direct;
    } else {
      reply = await createLead(trimmed);
    }
    setMessages((prev) => [...prev, { role: "ai", text: reply }]);
    setBusy(false);
  }

  return (
    <AppShell
      title="Customer Chatbot"
      subtitle="Website chat answers only from published Settings. Leads are claimed only after they appear in CRM."
    >
      <div className="split">
        <section className="panel">
          <h2>Website widget</h2>
          {status ? <p className="auth-error">{status}</p> : null}
          <div className="chat-mock" style={{ minHeight: 320 }}>
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role === "ai" ? "bubble-ai" : "bubble-user"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <form onSubmit={(event) => void onSend(event)} style={{ display: "flex", gap: "0.55rem", marginTop: "0.9rem" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about prices, hours, services…"
              style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 999, padding: "0.7rem 0.9rem" }}
              disabled={busy}
            />
            <button className="btn btn-dark" type="submit" disabled={busy}>
              Send
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Published knowledge</h2>
          <div className="list">
            {[
              ["Business", settings?.businessName || "Not loaded"],
              ["Hours", settings?.publicHours || "Not published"],
              ["Services", settings?.publicServices || "Not published"],
              ["Pricing", settings?.publicPricing || "Not published"],
              ["Address", settings?.publicAddress || "Not published"],
            ].map(([label, value]) => (
              <div className="list-row" key={label}>
                <span className={value.startsWith("Not") ? "badge" : "badge ok"}>{label}</span>
                <p>{value}</p>
              </div>
            ))}
          </div>
          <p className="panel-lead" style={{ marginTop: "0.8rem" }}>
            Owners publish FAQ copy under Settings. Until then, Atlas will not invent another plumbing company’s answers.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
