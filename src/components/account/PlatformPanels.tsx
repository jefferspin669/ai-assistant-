"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import {
  PLAN_TIERS,
  formatMoney,
  formatWhen,
  type PlanTier,
  type PublicAccount,
} from "@/lib/account";

type Flash = (msg: string) => void;
type Fail = (msg: string) => void;

export function AiWorkspacePanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const {
    autosaveDraft,
    startChat,
    shareChat,
    addPrompt,
    removePrompt,
    addAiFile,
    addProject,
  } = useAccount();

  const ws = account.aiWorkspace;
  const [draft, setDraft] = useState(ws.draftText);
  const [chatTitle, setChatTitle] = useState("");
  const [promptTitle, setPromptTitle] = useState("");
  const [promptBody, setPromptBody] = useState("");
  const [fileTitle, setFileTitle] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [filter, setFilter] = useState<"recent" | "shared" | "history">("recent");

  useEffect(() => {
    setDraft(ws.draftText);
  }, [ws.draftText]);

  const chats =
    filter === "shared"
      ? ws.chats.filter((c) => c.shared)
      : filter === "history"
        ? ws.chats
        : [...ws.chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 8);

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>AI workspace draft</h2>
        <p className="panel-lead">
          Auto-save {account.reliability.autoSave ? "is on" : "is off"} while typing.
        </p>
        <label className="form-grid">
          Compose
          <textarea
            value={draft}
            rows={3}
            onChange={(e) => {
              setDraft(e.target.value);
              if (account.reliability.autoSave) autosaveDraft(e.target.value);
            }}
            placeholder="Ask Atlas anything…"
          />
        </label>
        <form
          className="form-grid inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const text = draft.trim() || "How is business?";
            const result = startChat(chatTitle || text.slice(0, 40), text);
            if (!result.ok) return fail(result.error);
            setDraft("");
            setChatTitle("");
            note("Chat saved to workspace.");
          }}
        >
          <label>
            Chat title
            <input value={chatTitle} onChange={(e) => setChatTitle(e.target.value)} />
          </label>
          <button className="btn btn-dark" type="submit">
            Start chat
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Recent chats & history</h2>
        <div className="biz-switcher">
          {(
            [
              ["recent", "Recent chats"],
              ["history", "Conversation history"],
              ["shared", "Shared chats"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? "biz-chip active" : "biz-chip"}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="manage-list">
          {chats.length === 0 ? (
            <li>No chats in this view.</li>
          ) : (
            chats.map((chat) => (
              <li key={chat.id}>
                <div>
                  <strong>
                    {chat.title}
                    {chat.shared ? " · shared" : ""}
                  </strong>
                  <small>
                    {chat.preview} · {formatWhen(chat.updatedAt)}
                    {chat.projectId
                      ? ` · ${ws.projects.find((p) => p.id === chat.projectId)?.name || "project"}`
                      : ""}
                  </small>
                </div>
                <button
                  type="button"
                  className="ghost-link"
                  onClick={() => {
                    shareChat(chat.id);
                    note(chat.shared ? "Chat unshared." : "Chat shared with team.");
                  }}
                >
                  {chat.shared ? "Unshare" : "Share"}
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="panel">
        <h2>Saved prompts & library</h2>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const result = addPrompt(promptTitle, promptBody, true);
            if (!result.ok) return fail(result.error);
            setPromptTitle("");
            setPromptBody("");
            note("Prompt added to library.");
          }}
        >
          <label>
            Title
            <input value={promptTitle} onChange={(e) => setPromptTitle(e.target.value)} required />
          </label>
          <label>
            Prompt
            <textarea
              value={promptBody}
              onChange={(e) => setPromptBody(e.target.value)}
              rows={2}
              required
            />
          </label>
          <button className="btn btn-dark" type="submit">
            Save to library
          </button>
        </form>
        <ul className="manage-list">
          {ws.prompts.map((prompt) => (
            <li key={prompt.id}>
              <div>
                <strong>
                  {prompt.title}
                  {prompt.library ? " · library" : " · saved"}
                </strong>
                <small>{prompt.body}</small>
              </div>
              <button type="button" className="ghost-link" onClick={() => removePrompt(prompt.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>AI-generated files</h2>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const result = addAiFile(fileTitle, "document", fileContent);
            if (!result.ok) return fail(result.error);
            setFileTitle("");
            setFileContent("");
            note("Generated file saved.");
          }}
        >
          <label>
            Title
            <input value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} required />
          </label>
          <label>
            Content
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              rows={2}
              required
            />
          </label>
          <button className="btn btn-dark" type="submit">
            Save file
          </button>
        </form>
        <ul className="manage-list">
          {ws.generatedFiles.map((file) => (
            <li key={file.id}>
              <div>
                <strong>
                  {file.title} · {file.kind}
                </strong>
                <small>{file.content}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Project workspaces</h2>
        <form
          className="form-grid inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const result = addProject(projectName, projectDesc);
            if (!result.ok) return fail(result.error);
            setProjectName("");
            setProjectDesc("");
            note("Project workspace created.");
          }}
        >
          <label>
            Project name
            <input value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
          </label>
          <label>
            Description
            <input value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} />
          </label>
          <button className="btn btn-dark" type="submit">
            Add project
          </button>
        </form>
        <ul className="manage-list">
          {ws.projects.map((project) => (
            <li key={project.id}>
              <div>
                <strong>{project.name}</strong>
                <small>{project.description || "No description"}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function ReliabilityPanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const { patchReliability, syncDevices, recoverError } = useAccount();
  const r = account.reliability;

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>Reliability controls</h2>
        <div className="toggle-grid">
          <label className="check-row">
            <input
              type="checkbox"
              checked={r.autoSave}
              onChange={(e) => {
                patchReliability({ autoSave: e.target.checked });
                note(e.target.checked ? "Auto-save on." : "Auto-save off.");
              }}
            />
            Auto-save while typing
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={r.offlineMode}
              onChange={(e) => patchReliability({ offlineMode: e.target.checked })}
            />
            Offline mode (local cache where possible)
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={r.syncAcrossDevices}
              onChange={(e) => patchReliability({ syncAcrossDevices: e.target.checked })}
            />
            Sync across devices
          </label>
        </div>
        <p className="account-hint">
          Last sync: {r.lastSyncedAt ? formatWhen(r.lastSyncedAt) : "Never"}
          {r.lastError ? ` · Last error: ${r.lastError}` : ""}
          {r.recoveredAt ? ` · Recovered ${formatWhen(r.recoveredAt)}` : ""}
        </p>
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-dark"
            onClick={() => {
              const result = syncDevices();
              result.ok ? note("Sync completed.") : fail(result.error);
            }}
          >
            Sync now
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              const result = recoverError();
              result.ok ? note("Error recovery simulated.") : fail(result.error);
            }}
          >
            Test error recovery
          </button>
          <Link className="btn btn-outline" href="/status">
            Status page
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2>Fast loading</h2>
        <p className="panel-lead">
          This prototype keeps the workspace in local storage for instant loads after the first visit —
          no network round-trip for account data.
        </p>
        <ul className="plain-list">
          <li>Cached account vault on this device</li>
          <li>Draft autosave without waiting on a server</li>
          <li>Offline-friendly reads when the tab stays open</li>
        </ul>
      </section>
    </div>
  );
}

export function DeveloperPanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const { createKey, revokeKey, addHook, removeHook, flipPlugin, sandboxTest } = useAccount();
  const [keyName, setKeyName] = useState("");
  const [hookUrl, setHookUrl] = useState("https://example.com/atlas-hooks");
  const [hookEvents, setHookEvents] = useState("chat.completed, invoice.created");

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>API access</h2>
        <p className="panel-lead">Create keys for server-side Atlas Actions integrations.</p>
        <form
          className="form-grid inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const result = createKey(keyName);
            if (!result.ok) return fail(result.error);
            setKeyName("");
            note("API key created.");
          }}
        >
          <label>
            Key name
            <input value={keyName} onChange={(e) => setKeyName(e.target.value)} required />
          </label>
          <button className="btn btn-dark" type="submit">
            Create API key
          </button>
        </form>
        <ul className="manage-list">
          {account.appSettings.apiKeys.map((key) => (
            <li key={key.id}>
              <div>
                <strong>
                  {key.name} · {key.prefix}
                </strong>
                <small>hint {key.secretHint}</small>
              </div>
              <button type="button" className="ghost-link" onClick={() => revokeKey(key.id)}>
                Revoke
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Webhooks</h2>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const result = addHook(hookUrl, hookEvents);
            if (!result.ok) return fail(result.error);
            note("Webhook added.");
          }}
        >
          <label>
            Endpoint URL
            <input value={hookUrl} onChange={(e) => setHookUrl(e.target.value)} required />
          </label>
          <label>
            Events (comma-separated)
            <input value={hookEvents} onChange={(e) => setHookEvents(e.target.value)} />
          </label>
          <button className="btn btn-dark" type="submit">
            Add webhook
          </button>
        </form>
        <ul className="manage-list">
          {account.developer.webhooks.length === 0 ? (
            <li>No webhooks yet.</li>
          ) : (
            account.developer.webhooks.map((hook) => (
              <li key={hook.id}>
                <div>
                  <strong>{hook.url}</strong>
                  <small>{hook.events.join(", ")}</small>
                </div>
                <button type="button" className="ghost-link" onClick={() => removeHook(hook.id)}>
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="panel">
        <h2>Plugins & extensions</h2>
        <ul className="manage-list">
          {account.developer.plugins.map((plugin) => (
            <li key={plugin.id}>
              <div>
                <strong>
                  {plugin.name}
                  {plugin.enabled ? " · enabled" : ""}
                </strong>
                <small>{plugin.description}</small>
              </div>
              <button
                type="button"
                className="ghost-link"
                onClick={() => {
                  flipPlugin(plugin.id);
                  note(plugin.enabled ? "Plugin disabled." : "Plugin enabled.");
                }}
              >
                {plugin.enabled ? "Disable" : "Enable"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>SDKs, docs & sandbox</h2>
        <p className="panel-lead">
          SDKs (conceptual): <code>@atlas-ai/node</code>, <code>@atlas-ai/python</code>. Docs live at{" "}
          <Link href="/app/developers">Atlas API</Link> in the product nav.
        </p>
        <button
          type="button"
          className="btn btn-dark"
          onClick={() => {
            const result = sandboxTest("POST /v1/actions · sandbox · 200 · 38ms");
            result.ok ? note("Sandbox test recorded.") : fail(result.error);
          }}
        >
          Run sandbox test
        </button>
        <ul className="manage-list">
          {account.developer.sandboxLog.map((entry) => (
            <li key={entry.id}>
              <div>
                <strong>{entry.detail}</strong>
                <small>{formatWhen(entry.at)}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function BillingPanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const { changeBilling, addCard, claimReferral } = useAccount();
  const billing = account.appSettings.billing;
  const [last4, setLast4] = useState("");
  const [brand, setBrand] = useState("Visa");

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>Plans</h2>
        <div className="plan-grid">
          {PLAN_TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              className={billing.plan === tier.id ? "plan-card active" : "plan-card"}
              onClick={() => {
                const result = changeBilling({ plan: tier.id as PlanTier, status: "active" });
                result.ok ? note(`Switched to ${tier.label}.`) : fail(result.error);
              }}
            >
              <strong>{tier.label}</strong>
              <span className="plan-price">{tier.price}</span>
              <small>{tier.blurb}</small>
            </button>
          ))}
        </div>
        <p className="account-hint">
          Current: {billing.plan} · {billing.status} · {billing.seats} seats · renews{" "}
          {formatWhen(billing.renewsAt)}
        </p>
      </section>

      <section className="panel">
        <h2>Usage dashboard</h2>
        <div className="stat-grid">
          <div className="stat-tile">
            <span>AI requests</span>
            <strong>{billing.usage.aiRequests.toLocaleString()}</strong>
          </div>
          <div className="stat-tile">
            <span>Storage</span>
            <strong>{billing.usage.storageMb} MB</strong>
          </div>
          <div className="stat-tile">
            <span>Seats used</span>
            <strong>
              {billing.usage.seatsUsed}/{billing.seats}
            </strong>
          </div>
        </div>
        <p className="account-hint">{billing.usage.periodLabel}</p>
      </section>

      <section className="panel">
        <h2>Payment methods</h2>
        <ul className="manage-list">
          {billing.paymentMethods.map((method) => (
            <li key={method.id}>
              <div>
                <strong>
                  {method.brand} ···· {method.last4}
                  {method.isDefault ? " · default" : ""}
                </strong>
                <small>
                  Exp {method.expMonth}/{method.expYear}
                </small>
              </div>
            </li>
          ))}
        </ul>
        <form
          className="form-grid inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const result = addCard(brand, last4);
            if (!result.ok) return fail(result.error);
            setLast4("");
            note("Payment method added.");
          }}
        >
          <label>
            Brand
            <input value={brand} onChange={(e) => setBrand(e.target.value)} />
          </label>
          <label>
            Last 4
            <input
              value={last4}
              onChange={(e) => setLast4(e.target.value)}
              maxLength={4}
              required
            />
          </label>
          <button className="btn btn-dark" type="submit">
            Add card
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Invoice history</h2>
        <ul className="manage-list">
          {billing.invoices.map((invoice) => (
            <li key={invoice.id}>
              <div>
                <strong>
                  {formatMoney(invoice.amount)} · {invoice.status}
                </strong>
                <small>
                  {formatWhen(invoice.at)} · {invoice.description}
                </small>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Referral program</h2>
        <p className="panel-lead">
          Your code: <strong>{billing.referralCode}</strong> · credits{" "}
          {formatMoney(billing.referralCredits)}
        </p>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            const result = claimReferral();
            result.ok ? note("Referral credit applied.") : fail(result.error);
          }}
        >
          Apply demo referral credit
        </button>
      </section>
    </div>
  );
}

export function AnalyticsPanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const { sendFeedback } = useAccount();
  const a = account.analytics;
  const [rating, setRating] = useState(5);
  const [feedbackNote, setFeedbackNote] = useState("");

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>Productivity snapshot</h2>
        <div className="stat-grid">
          <div className="stat-tile">
            <span>AI usage</span>
            <strong>{a.aiRequests.toLocaleString()}</strong>
          </div>
          <div className="stat-tile">
            <span>Time saved</span>
            <strong>{a.timeSavedHours}h</strong>
          </div>
          <div className="stat-tile">
            <span>Tasks completed</span>
            <strong>{a.tasksCompleted}</strong>
          </div>
          <div className="stat-tile">
            <span>Money saved</span>
            <strong>{formatMoney(a.moneySaved)}</strong>
          </div>
          <div className="stat-tile">
            <span>AI accuracy</span>
            <strong>{a.accuracyScore}%</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Productivity report</h2>
        <div className="week-bars">
          {a.weekly.map((day) => (
            <div key={day.label} className="week-bar">
              <div
                className="week-bar-fill"
                style={{ height: `${Math.max(12, (day.requests / 230) * 100)}%` }}
                title={`${day.requests} requests`}
              />
              <span>{day.label}</span>
              <small>{day.tasks} tasks</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>AI accuracy feedback</h2>
        <form
          className="form-grid"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            const result = sendFeedback(rating, feedbackNote);
            if (!result.ok) return fail(result.error);
            setFeedbackNote("");
            note("Feedback recorded.");
          }}
        >
          <label>
            Rating (1–5)
            <input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </label>
          <label>
            Note
            <input
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="What should Atlas improve?"
            />
          </label>
          <button className="btn btn-dark" type="submit">
            Submit feedback
          </button>
        </form>
        <ul className="manage-list">
          {a.feedback.length === 0 ? (
            <li>No feedback yet.</li>
          ) : (
            a.feedback.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.rating}/5</strong>
                  <small>
                    {formatWhen(item.at)} · {item.note}
                  </small>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
