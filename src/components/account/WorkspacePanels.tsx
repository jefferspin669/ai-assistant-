"use client";

import { FormEvent, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import {
  VOICE_OPTIONS,
  formatWhen,
  searchEverything,
  type TeamRole,
  type PublicAccount,
} from "@/lib/account";

type Flash = (msg: string) => void;
type Fail = (msg: string) => void;

const ROLES: TeamRole[] = ["admin", "manager", "employee"];

export function OrganizationPanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const {
    createOrgFolder,
    removeOrgFolder,
    createOrgTag,
    removeOrgTag,
    organizeCloud,
    trashCloud,
    restoreCloud,
  } = useAccount();

  const [folderName, setFolderName] = useState("");
  const [tagName, setTagName] = useState("");
  const [query, setQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [view, setView] = useState<"active" | "favorites" | "archived" | "trash">("active");

  // Re-run against the latest vault whenever the signed-in account snapshot changes.
  const hits = account ? searchEverything(query) : [];

  const items = account.cloudItems.filter((item) => {
    if (view === "trash") return Boolean(item.deletedAt);
    if (item.deletedAt) return false;
    if (view === "favorites") return item.favorite;
    if (view === "archived") return item.archived;
    if (item.archived) return false;
    if (folderFilter !== "all" && item.folderId !== folderFilter) return false;
    return true;
  });

  const sorted = [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>Search everything</h2>
        <p className="panel-lead">Cloud items, memories, knowledge base, and team chat.</p>
        <label className="form-grid">
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Estimates, Elena, workflow…"
          />
        </label>
        {query.trim() ? (
          <ul className="manage-list">
            {hits.length === 0 ? (
              <li>No matches.</li>
            ) : (
              hits.map((hit) => (
                <li key={`${hit.source}-${hit.id}`}>
                  <div>
                    <strong>
                      {hit.title} · {hit.source}
                    </strong>
                    <small>{hit.snippet}</small>
                  </div>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </section>

      <section className="panel">
        <h2>Folders & tags</h2>
        <form
          className="form-grid inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const result = createOrgFolder(folderName);
            if (!result.ok) return fail(result.error);
            setFolderName("");
            note("Folder created.");
          }}
        >
          <label>
            New folder
            <input value={folderName} onChange={(e) => setFolderName(e.target.value)} required />
          </label>
          <button className="btn btn-dark" type="submit">
            Add folder
          </button>
        </form>
        <div className="biz-switcher">
          {account.folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className="biz-chip"
              onClick={() => {
                const result = removeOrgFolder(folder.id);
                result.ok ? note(`Removed folder ${folder.name}.`) : fail(result.error);
              }}
              title="Click to delete folder"
            >
              {folder.name} ×
            </button>
          ))}
        </div>

        <form
          className="form-grid inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            const result = createOrgTag(tagName);
            if (!result.ok) return fail(result.error);
            setTagName("");
            note("Tag created.");
          }}
        >
          <label>
            New tag
            <input value={tagName} onChange={(e) => setTagName(e.target.value)} required />
          </label>
          <button className="btn btn-dark" type="submit">
            Add tag
          </button>
        </form>
        <div className="biz-switcher">
          {account.tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className="biz-chip"
              style={{ borderColor: tag.color }}
              onClick={() => {
                const result = removeOrgTag(tag.id);
                result.ok ? note(`Removed tag ${tag.name}.`) : fail(result.error);
              }}
            >
              {tag.name} ×
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Library</h2>
        <div className="biz-switcher">
          {(
            [
              ["active", "Active"],
              ["favorites", "Favorites"],
              ["archived", "Archive"],
              ["trash", "Trash bin"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={view === id ? "biz-chip active" : "biz-chip"}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        {view === "active" ? (
          <label className="form-grid" style={{ marginBottom: "0.75rem" }}>
            Folder filter
            <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)}>
              <option value="all">All folders</option>
              {account.folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <ul className="manage-list">
          {sorted.length === 0 ? (
            <li>Nothing here yet.</li>
          ) : (
            sorted.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>
                    {item.pinned ? "Pinned · " : ""}
                    {item.title}
                    {item.favorite ? " · favorite" : ""}
                  </strong>
                  <small>
                    {item.kind}
                    {item.folderId
                      ? ` · ${account.folders.find((f) => f.id === item.folderId)?.name || "folder"}`
                      : ""}
                    {item.tagIds.length
                      ? ` · ${item.tagIds
                          .map((id) => account.tags.find((t) => t.id === id)?.name)
                          .filter(Boolean)
                          .join(", ")}`
                      : ""}
                  </small>
                </div>
                <div className="list-actions">
                  {view === "trash" ? (
                    <button type="button" className="ghost-link" onClick={() => restoreCloud(item.id)}>
                      Restore
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="ghost-link"
                        onClick={() => {
                          organizeCloud(item.id, { pinned: !item.pinned });
                          note(item.pinned ? "Unpinned." : "Pinned.");
                        }}
                      >
                        {item.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        type="button"
                        className="ghost-link"
                        onClick={() => {
                          organizeCloud(item.id, { favorite: !item.favorite });
                          note(item.favorite ? "Removed from favorites." : "Favorited.");
                        }}
                      >
                        {item.favorite ? "Unfavorite" : "Favorite"}
                      </button>
                      <button
                        type="button"
                        className="ghost-link"
                        onClick={() => {
                          organizeCloud(item.id, { archived: !item.archived });
                          note(item.archived ? "Unarchived." : "Archived.");
                        }}
                      >
                        {item.archived ? "Unarchive" : "Archive"}
                      </button>
                      <label className="mini-select">
                        <span className="sr-only">Folder</span>
                        <select
                          value={item.folderId || ""}
                          onChange={(e) => {
                            organizeCloud(item.id, { folderId: e.target.value || null });
                            note("Folder updated.");
                          }}
                        >
                          <option value="">No folder</option>
                          {account.folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button type="button" className="ghost-link" onClick={() => trashCloud(item.id)}>
                        Trash
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}

export function NotificationsPanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const { patchNotifications, toggleDnd } = useAccount();
  const n = account.notifications;

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>Channels</h2>
        <p className="panel-lead">Push, email, optional SMS, and desktop alerts.</p>
        <div className="toggle-grid">
          {(
            [
              ["push", "Push notifications"],
              ["email", "Email notifications"],
              ["sms", "SMS (optional)"],
              ["desktop", "Desktop notifications"],
            ] as const
          ).map(([key, label]) => (
            <label className="check-row" key={key}>
              <input
                type="checkbox"
                checked={n[key]}
                onChange={(e) => {
                  const result = patchNotifications({ [key]: e.target.checked });
                  result.ok ? note(`${label} updated.`) : fail(result.error);
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Custom notification settings</h2>
        <div className="toggle-grid">
          {(
            [
              ["security", "Security alerts"],
              ["billing", "Billing & subscription"],
              ["team", "Team activity"],
              ["ai", "AI suggestions"],
              ["marketing", "Product tips"],
            ] as const
          ).map(([key, label]) => (
            <label className="check-row" key={key}>
              <input
                type="checkbox"
                checked={n.categories[key]}
                onChange={(e) => {
                  patchNotifications({
                    categories: { ...n.categories, [key]: e.target.checked },
                  });
                  note(`${label} preference saved.`);
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Do Not Disturb</h2>
        <p className="panel-lead">
          {n.doNotDisturb
            ? `On until ${n.dndUntil ? formatWhen(n.dndUntil) : "later"}.`
            : "All enabled channels can notify you."}
        </p>
        <button
          type="button"
          className="btn btn-dark"
          onClick={() => {
            const result = toggleDnd(!n.doNotDisturb);
            result.ok
              ? note(n.doNotDisturb ? "Do Not Disturb off." : "Do Not Disturb on for 2 hours.")
              : fail(result.error);
          }}
        >
          {n.doNotDisturb ? "Turn off DND" : "Enable Do Not Disturb"}
        </button>
      </section>
    </div>
  );
}

export function TeamPanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const {
    inviteMember,
    changeMemberRole,
    removeMember,
    addWorkspace,
    addKnowledge,
    postTeamChat,
  } = useAccount();

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("employee");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDesc, setWorkspaceDesc] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState(account.workspaces[0]?.id || "");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleBody, setArticleBody] = useState("");
  const [chatText, setChatText] = useState("");

  const workspaceId = activeWorkspace || account.workspaces[0]?.id || "";
  const articles = account.knowledgeBase.filter((a) => a.workspaceId === workspaceId);
  const chat = account.teamChat.filter((m) => m.workspaceId === workspaceId);

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>Team members & roles</h2>
        <p className="panel-lead">Owner, Admin, Manager, Employee — with invite controls.</p>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const result = inviteMember(inviteName, inviteEmail, inviteRole);
            if (!result.ok) return fail(result.error);
            setInviteName("");
            setInviteEmail("");
            note("Invite sent.");
          }}
        >
          <label>
            Name
            <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} required />
          </label>
          <label>
            Email
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Role
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as TeamRole)}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-dark" type="submit">
            Invite team member
          </button>
        </form>
        <ul className="manage-list">
          {account.teamMembers.map((member) => (
            <li key={member.id}>
              <div>
                <strong>
                  {member.name} · {member.role} · {member.status}
                </strong>
                <small>{member.email}</small>
              </div>
              <div className="list-actions">
                {member.role !== "owner" ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => {
                        const result = changeMemberRole(member.id, e.target.value as TeamRole);
                        result.ok ? note("Role updated.") : fail(result.error);
                      }}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="ghost-link" onClick={() => removeMember(member.id)}>
                      Remove
                    </button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Shared workspaces</h2>
        <div className="biz-switcher">
          {account.workspaces.map((space) => (
            <button
              key={space.id}
              type="button"
              className={workspaceId === space.id ? "biz-chip active" : "biz-chip"}
              onClick={() => setActiveWorkspace(space.id)}
            >
              {space.name}
            </button>
          ))}
        </div>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const result = addWorkspace(workspaceName, workspaceDesc);
            if (!result.ok) return fail(result.error);
            setWorkspaceName("");
            setWorkspaceDesc("");
            note("Workspace created.");
          }}
        >
          <label>
            New workspace
            <input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} required />
          </label>
          <label>
            Description
            <input value={workspaceDesc} onChange={(e) => setWorkspaceDesc(e.target.value)} />
          </label>
          <button className="btn btn-dark" type="submit">
            Create workspace
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Shared knowledge base</h2>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const result = addKnowledge(workspaceId, articleTitle, articleBody);
            if (!result.ok) return fail(result.error);
            setArticleTitle("");
            setArticleBody("");
            note("Knowledge article saved.");
          }}
        >
          <label>
            Title
            <input value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} required />
          </label>
          <label>
            Content
            <textarea
              value={articleBody}
              onChange={(e) => setArticleBody(e.target.value)}
              rows={3}
              required
            />
          </label>
          <button className="btn btn-dark" type="submit">
            Add article
          </button>
        </form>
        <ul className="manage-list">
          {articles.map((article) => (
            <li key={article.id}>
              <div>
                <strong>{article.title}</strong>
                <small>{article.content}</small>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Team chat</h2>
        <div className="team-chat">
          {chat.map((message) => (
            <div className="team-chat-line" key={message.id}>
              <strong>{message.authorName}</strong>
              <span>{message.text}</span>
              <small>{formatWhen(message.at)}</small>
            </div>
          ))}
        </div>
        <form
          className="form-grid inline-form"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            const result = postTeamChat(workspaceId, chatText);
            if (!result.ok) return fail(result.error);
            setChatText("");
          }}
        >
          <label>
            Message
            <input value={chatText} onChange={(e) => setChatText(e.target.value)} required />
          </label>
          <button className="btn btn-dark" type="submit">
            Send
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Audit logs</h2>
        <ul className="manage-list">
          {account.auditLogs.length === 0 ? (
            <li>No audit events yet.</li>
          ) : (
            account.auditLogs.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>
                    {entry.action} · {entry.actor}
                  </strong>
                  <small>
                    {formatWhen(entry.at)} · {entry.detail}
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

export function SettingsPanel({
  account,
  note,
  fail,
}: {
  account: PublicAccount;
  note: Flash;
  fail: Fail;
}) {
  const {
    updateBusiness,
    updateAppPrefs,
    connectApp,
    changeBilling,
    createKey,
    revokeKey,
    exportData,
    wipeData,
    aiPersonality,
  } = useAccount();

  const activeBiz =
    account.businesses.find((b) => b.id === account.activeBusinessId) || account.businesses[0];
  const [personality, setPersonality] = useState(activeBiz?.aiPersonality || aiPersonality);
  const [voiceId, setVoiceId] = useState(account.appSettings.voiceId);
  const [keyName, setKeyName] = useState("");
  const [exportPreview, setExportPreview] = useState("");

  return (
    <div className="account-stack">
      <section className="panel">
        <h2>AI personality & voice</h2>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            if (!activeBiz) return;
            const voice = VOICE_OPTIONS.find((v) => v.id === voiceId) || VOICE_OPTIONS[0];
            const bizResult = updateBusiness(activeBiz.id, { aiPersonality: personality });
            const voiceResult = updateAppPrefs({
              voiceId: voice.id,
              voiceLabel: voice.label,
            });
            if (!bizResult.ok) return fail(bizResult.error);
            if (!voiceResult.ok) return fail(voiceResult.error);
            note("AI personality and voice saved.");
          }}
        >
          <label>
            AI personality
            <select value={personality} onChange={(e) => setPersonality(e.target.value)}>
              {["Friendly", "Professional", "Funny", "Serious"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Voice selection
            <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
              {VOICE_OPTIONS.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-dark" type="submit">
            Save AI settings
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Privacy controls</h2>
        <div className="toggle-grid">
          {(
            [
              ["shareUsage", "Share anonymized usage analytics"],
              ["allowTraining", "Allow model-improvement training on my content"],
              ["showOnlineStatus", "Show online status to teammates"],
            ] as const
          ).map(([key, label]) => (
            <label className="check-row" key={key}>
              <input
                type="checkbox"
                checked={account.appSettings.privacy[key]}
                onChange={(e) => {
                  updateAppPrefs({
                    privacy: { ...account.appSettings.privacy, [key]: e.target.checked },
                  });
                  note("Privacy preference saved.");
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Connected apps</h2>
        <ul className="manage-list">
          {account.appSettings.connectedApps.map((app) => (
            <li key={app.id}>
              <div>
                <strong>{app.name}</strong>
                <small>
                  {app.connected
                    ? `Connected ${app.connectedAt ? formatWhen(app.connectedAt) : ""}`
                    : "Not connected"}
                </small>
              </div>
              <button
                type="button"
                className="ghost-link"
                onClick={() => {
                  const result = connectApp(app.id, !app.connected);
                  result.ok
                    ? note(app.connected ? `${app.name} disconnected.` : `${app.name} connected.`)
                    : fail(result.error);
                }}
              >
                {app.connected ? "Disconnect" : "Connect"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Billing & subscription</h2>
        <p className="panel-lead">
          Plan <strong>{account.appSettings.billing.plan}</strong> ·{" "}
          {account.appSettings.billing.status} · {account.appSettings.billing.seats} seats · renews{" "}
          {formatWhen(account.appSettings.billing.renewsAt)}
        </p>
        <p className="account-hint">
          Full plan controls, invoices, and payment methods live in the Billing tab.
        </p>
        <div className="biz-switcher">
          {(["free", "pro", "business", "enterprise"] as const).map((plan) => (
            <button
              key={plan}
              type="button"
              className={
                account.appSettings.billing.plan === plan ? "biz-chip active" : "biz-chip"
              }
              onClick={() => {
                const result = changeBilling({ plan, status: "active" });
                result.ok ? note(`Switched to ${plan}.`) : fail(result.error);
              }}
            >
              {plan}
            </button>
          ))}
        </div>
        <label className="form-grid">
          Seats
          <input
            type="number"
            min={1}
            max={100}
            value={account.appSettings.billing.seats}
            onChange={(e) => changeBilling({ seats: Number(e.target.value) || 1 })}
          />
        </label>
      </section>

      <section className="panel">
        <h2>API keys</h2>
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
            <input
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="Production server"
              required
            />
          </label>
          <button className="btn btn-dark" type="submit">
            Create key
          </button>
        </form>
        <ul className="manage-list">
          {account.appSettings.apiKeys.length === 0 ? (
            <li>No developer keys yet.</li>
          ) : (
            account.appSettings.apiKeys.map((key) => (
              <li key={key.id}>
                <div>
                  <strong>
                    {key.name} · {key.prefix}
                  </strong>
                  <small>
                    hint {key.secretHint} · created {formatWhen(key.createdAt)}
                  </small>
                </div>
                <button type="button" className="ghost-link" onClick={() => revokeKey(key.id)}>
                  Revoke
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="panel">
        <h2>Data export & deletion</h2>
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              const result = exportData();
              if (!result.ok) return fail(result.error);
              setExportPreview(result.json.slice(0, 1200));
              const blob = new Blob([result.json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "atlas-account-export.json";
              a.click();
              URL.revokeObjectURL(url);
              note("Export downloaded.");
            }}
          >
            Export data
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              if (!confirm("Delete vault content from this device? This can’t be undone locally.")) {
                return;
              }
              const result = wipeData();
              result.ok ? note("Local vault data deleted.") : fail(result.error);
            }}
          >
            Delete data
          </button>
        </div>
        {exportPreview ? (
          <pre className="export-preview">{exportPreview}…</pre>
        ) : null}
      </section>
    </div>
  );
}
