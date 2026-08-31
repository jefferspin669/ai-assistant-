"use client";

import Link from "@/components/SiteLink";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAccount } from "@/components/AccountProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { atlasApi } from "@/lib/api/atlas-api";
import { settingsHub } from "@/lib/section-hubs";
import type {
  DbOrganization,
  DbOrganizationMember,
  DbUser,
  OrgMemberRole,
  OrgMemberStatus,
} from "@/lib/db/schema";

const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
  "Europe/London",
];

const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "fr", label: "French" },
];

const TAX_STRUCTURES = ["Sole proprietor", "LLC", "S-Corp", "C-Corp", "Partnership"];
const MEMBER_ROLES: OrgMemberRole[] = ["owner", "admin", "manager", "employee", "viewer"];
const MEMBER_STATUSES: OrgMemberStatus[] = ["active", "invited", "suspended", "removed"];

export function SettingsStudio() {
  const { account, ownerName, businessName, logout, ready } = useAccount();
  const { setLanguage: setUiLanguage, languages: uiLanguages } = useLanguage();
  const [user, setUser] = useState<DbUser | null>(null);
  const [org, setOrg] = useState<DbOrganization | null>(null);
  const [members, setMembers] = useState<DbOrganizationMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgMemberRole>("employee");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [language, setLanguage] = useState("en");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [businessNameField, setBusinessNameField] = useState("");
  const [businessType, setBusinessType] = useState("HVAC");
  const [taxStructure, setTaxStructure] = useState("LLC");
  const [orgState, setOrgState] = useState("TX");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [notes, setNotes] = useState(0);
  const [flash, setFlash] = useState("");

  function loadRows() {
    const listed = atlasApi.users.list();
    if (listed.ok && listed.data[0]) {
      const row = listed.data[0];
      setUser(row);
      setFullName(row.full_name);
      setEmail(row.email);
      setTimezone(row.timezone);
      setLanguage(row.preferred_language);
      setProfileImage(row.profile_image);
    }
    const orgs = atlasApi.businesses.list();
    if (orgs.ok && orgs.data[0]) {
      const row = orgs.data[0];
      setOrg(row);
      setBusinessNameField(row.business_name);
      setBusinessType(row.business_type);
      setTaxStructure(row.tax_structure);
      setOrgState(row.state);
      setLogoUrl(row.logo_url);
      const memberRows = atlasApi.organizationMembers.list(row.id);
      if (memberRows.ok) setMembers(memberRows.data);
    }
  }

  function userLabel(userId: string) {
    const listed = atlasApi.users.list();
    if (!listed.ok) return userId;
    const match = listed.data.find((u) => u.id === userId);
    return match ? `${match.full_name} · ${match.email}` : userId;
  }

  useEffect(() => {
    loadRows();
    const sub = atlasApi.billing.getSubscription();
    if (sub.ok && sub.data) setPlan(sub.data.plan);
    const n = atlasApi.notifications.list();
    if (n.ok) setNotes(n.data.filter((item) => !item.read).length);
  }, []);

  function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      setFlash("No users row yet — open Admin and re-seed the database.");
      return;
    }
    const result = atlasApi.users.update(user.id, {
      full_name: fullName,
      email,
      timezone,
      preferred_language: language,
      profile_image: profileImage,
    });
    if (!result.ok) {
      setFlash(result.error);
      return;
    }
    setUser(result.data);
    setUiLanguage(language);
    setFlash("users row updated — app language applied across pages.");
  }

  return (
    <AppShell
      title="Settings"
      subtitle="Workspace settings. Sign-in here is still a prototype vault — not production authentication."
    >
      <div className="tax-safety-banner" style={{ marginBottom: "1rem" }}>
        <div className="tax-safety-banner-head">
          <strong>DEMO auth</strong>
          <span>
            Passwords are hashed in the browser for this prototype. Real Atlas needs Auth.js or Supabase Auth,
            sessions, email verification, and recovery — this is not that yet.
          </span>
        </div>
      </div>
      <div className="hub-grid" style={{ marginBottom: "1.25rem" }}>
        {settingsHub.map((item) => (
          <Link className="hub-card" href={item.href} key={item.href}>
            <h3>{item.label}</h3>
            <p>{item.blurb}</p>
          </Link>
        ))}
      </div>
      {flash ? (
        <p className={flash.toLowerCase().includes("no users") || flash.toLowerCase().includes("not found") ? "auth-error" : "auth-success"}>
          {flash}
        </p>
      ) : null}

      <div className="split">
        <section className="panel">
          <h2>User profile</h2>
          <p className="panel-lead">
            Database <code>users</code>
            {user ? ` · ${user.id}` : ""}. Account Center remains available for the richer workspace.
          </p>
          <form className="form-grid" onSubmit={onSaveProfile}>
            <label>
              full_name
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </label>
            <label>
              email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              timezone
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
            <label>
              preferred_language
              <select
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setUiLanguage(e.target.value);
                }}
              >
                {(uiLanguages.length ? uiLanguages : LANGUAGES).map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {"native" in lang ? `${lang.label} (${lang.native})` : lang.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              profile_image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 400_000) {
                    setFlash("Keep profile images under ~400KB for the demo vault.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setProfileImage(String(reader.result || ""));
                    setFlash("profile_image ready — save to write the users row.");
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImage}
                alt=""
                style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12 }}
              />
            ) : (
              <p className="account-hint">No profile_image set.</p>
            )}
            <button className="btn btn-dark" type="submit">
              Save users row
            </button>
          </form>
          {user ? (
            <ul className="manage-list" style={{ marginTop: "1rem" }}>
              <li>
                <div>
                  <strong>created_at</strong>
                  <small>{new Date(user.created_at).toLocaleString()}</small>
                </div>
              </li>
              <li>
                <div>
                  <strong>updated_at</strong>
                  <small>{new Date(user.updated_at).toLocaleString()}</small>
                </div>
              </li>
            </ul>
          ) : null}
        </section>

        <section className="panel">
          <h2>Organization</h2>
          <p className="panel-lead">
            Database <code>organizations</code>
            {org ? ` · ${org.id}` : ""}.
            {org ? ` owner_id ${org.owner_id}` : ""}
          </p>
          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              if (!org) {
                setFlash("No organizations row yet — open Admin and re-seed the database.");
                return;
              }
              const result = atlasApi.businesses.update(org.id, {
                business_name: businessNameField,
                business_type: businessType,
                tax_structure: taxStructure,
                state: orgState,
                logo_url: logoUrl,
              });
              if (!result.ok) {
                setFlash(result.error);
                return;
              }
              setOrg(result.data);
              setFlash("organizations row updated.");
            }}
          >
            <label>
              business_name
              <input
                value={businessNameField}
                onChange={(e) => setBusinessNameField(e.target.value)}
                required
              />
            </label>
            <label>
              business_type
              <input value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
            </label>
            <label>
              tax_structure
              <select value={taxStructure} onChange={(e) => setTaxStructure(e.target.value)}>
                {TAX_STRUCTURES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              state
              <input
                value={orgState}
                maxLength={2}
                onChange={(e) => setOrgState(e.target.value.toUpperCase())}
                required
              />
            </label>
            <label>
              logo_url
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 400_000) {
                    setFlash("Keep logos under ~400KB for the demo vault.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setLogoUrl(String(reader.result || ""));
                    setFlash("logo_url ready — save to write the organizations row.");
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12 }}
              />
            ) : (
              <p className="account-hint">No logo_url set.</p>
            )}
            <button className="btn btn-dark" type="submit">
              Save organizations row
            </button>
          </form>
          {org ? (
            <p className="account-hint" style={{ marginTop: "0.75rem" }}>
              created_at {new Date(org.created_at).toLocaleString()}
            </p>
          ) : null}
        </section>
      </div>

      <section className="panel">
        <h2>Organization members</h2>
        <p className="panel-lead">
          Database <code>organization_members</code> — id, organization_id, user_id, role, status,
          joined_at.
        </p>
        <ul className="manage-list">
          {members.length === 0 ? (
            <li>No members yet.</li>
          ) : (
            members.map((member) => (
              <li key={member.id}>
                <div>
                  <strong>{userLabel(member.user_id)}</strong>
                  <small>
                    {member.role} · {member.status} · joined{" "}
                    {new Date(member.joined_at).toLocaleDateString()}
                  </small>
                </div>
                <div className="list-actions">
                  <select
                    value={member.role}
                    onChange={(e) => {
                      const result = atlasApi.organizationMembers.update(member.id, {
                        role: e.target.value as OrgMemberRole,
                      });
                      if (result.ok) {
                        setMembers((prev) =>
                          prev.map((m) => (m.id === member.id ? result.data : m)),
                        );
                        setFlash("Member role updated.");
                      }
                    }}
                  >
                    {MEMBER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <select
                    value={member.status}
                    onChange={(e) => {
                      const result = atlasApi.organizationMembers.update(member.id, {
                        status: e.target.value as OrgMemberStatus,
                      });
                      if (result.ok) {
                        setMembers((prev) =>
                          prev.map((m) => (m.id === member.id ? result.data : m)),
                        );
                        setFlash("Member status updated.");
                      }
                    }}
                  >
                    {MEMBER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </li>
            ))
          )}
        </ul>
        <form
          className="form-grid"
          style={{ marginTop: "1rem" }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!org) {
              setFlash("No organization to invite into.");
              return;
            }
            const result = atlasApi.organizationMembers.invite({
              organization_id: org.id,
              email: inviteEmail,
              role: inviteRole,
            });
            if (!result.ok) {
              setFlash(result.error);
              return;
            }
            setInviteEmail("");
            setMembers((prev) => [result.data, ...prev]);
            setFlash("Member invited.");
          }}
        >
          <label>
            Invite email
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </label>
          <label>
            role
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgMemberRole)}
            >
              {MEMBER_ROLES.filter((role) => role !== "owner").map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-dark" type="submit">
            Invite member
          </button>
        </form>
      </section>

      <div className="split">
        <section className="panel">
          <h2>Account session</h2>
          <p className="panel-lead">
            {ready && account
              ? `${ownerName} · ${businessName}`
              : "Guest mode — register to sync Account Center with Authentication."}
          </p>
          <div className="cta-row">
            <Link className="btn btn-dark" href="/app/account">
              Open Account Center
            </Link>
            {account ? (
              <button type="button" className="btn btn-outline" onClick={() => logout()}>
                Log out
              </button>
            ) : (
              <Link className="btn btn-outline" href="/login">
                Log in
              </Link>
            )}
          </div>

          <h3 style={{ marginTop: "1.25rem" }}>Notifications</h3>
          <p className="panel-lead">{notes} unread in the database.</p>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              const list = atlasApi.notifications.list();
              if (!list.ok) return;
              list.data.filter((n) => !n.read).forEach((n) => atlasApi.notifications.markRead(n.id));
              setNotes(0);
              setFlash("Notifications marked read.");
            }}
          >
            Mark all read
          </button>
        </section>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Billing</h2>
          <p className="panel-lead">Current plan: {plan}</p>
          <div className="cta-row">
            {(["free", "pro", "business", "enterprise"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={plan === item ? "btn btn-dark" : "btn btn-outline"}
                onClick={() => {
                  const result = atlasApi.billing.changePlan(item);
                  if (result.ok) {
                    setPlan(result.data.plan);
                    setFlash(`Plan set to ${result.data.plan}.`);
                  }
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Workspace setup</h2>
          <p className="panel-lead">Industry, integrations, and how Atlas should greet you.</p>
          <Link className="btn btn-dark" href="/app/setup">
            Open setup
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
