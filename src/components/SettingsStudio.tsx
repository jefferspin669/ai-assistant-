"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAccount } from "@/components/AccountProvider";
import { atlasApi } from "@/lib/api/atlas-api";
import type { DbUser } from "@/lib/db/schema";

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

export function SettingsStudio() {
  const { account, ownerName, businessName, logout, ready } = useAccount();
  const [user, setUser] = useState<DbUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("America/Chicago");
  const [language, setLanguage] = useState("en");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [plan, setPlan] = useState("free");
  const [notes, setNotes] = useState(0);
  const [flash, setFlash] = useState("");

  function loadUser() {
    const listed = atlasApi.users.list();
    if (!listed.ok || !listed.data[0]) return;
    const row = listed.data[0];
    setUser(row);
    setFullName(row.full_name);
    setEmail(row.email);
    setTimezone(row.timezone);
    setLanguage(row.preferred_language);
    setProfileImage(row.profile_image);
  }

  useEffect(() => {
    loadUser();
    const sub = atlasApi.billing.getSubscription();
    if (sub.ok && sub.data) setPlan(sub.data.plan);
    const n = atlasApi.notifications.list();
    if (n.ok) setNotes(n.data.filter((item) => !item.read).length);
  }, []);

  function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      setFlash("No users row yet — open Architecture and re-seed the database.");
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
    setFlash("users row updated.");
  }

  return (
    <AppShell
      title="Settings"
      subtitle="users table — id, email, full_name, profile_image, timezone, preferred_language."
    >
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
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
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
          <h2>Architecture</h2>
          <p className="panel-lead">Inspect Frontend · Backend API · Database wiring.</p>
          <Link className="btn btn-dark" href="/app/architecture">
            Open architecture map
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
