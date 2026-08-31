"use client";

import Link from "@/components/SiteLink";
import { useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { industries } from "@/lib/data";
import { hardNavigate } from "@/lib/hard-nav";
import {
  activateProductionWorkspace,
  enterPreviewWorkspace,
  loadWorkspaceActivation,
  markConnectionsReviewed,
  markTeamInvited,
  updateCompanyProfile,
  type CompanyWorkspaceProfile,
} from "@/lib/workspace-mode";

const STEPS = [
  "Preview Atlas",
  "Create your company",
  "Connect data",
  "Add team",
  "Activate",
] as const;

const CONNECTIONS = [
  { id: "email", label: "Email", href: "/app/connections" },
  { id: "calendar", label: "Calendar", href: "/app/appointments" },
  { id: "phone", label: "Phone", href: "/app/phone" },
  { id: "payments", label: "Payments / accounting", href: "/app/commercial" },
  { id: "crm", label: "CRM", href: "/app/customers" },
  { id: "social", label: "Social accounts", href: "/app/marketing" },
  { id: "reviews", label: "Review platforms", href: "/app/reviews" },
  { id: "website", label: "Website / chatbot", href: "/app/chatbot" },
];

export function WorkspaceActivationWizard() {
  const { account } = useAccount();
  const saved = loadWorkspaceActivation();
  const [step, setStep] = useState(saved.step > 0 ? Math.min(saved.step, STEPS.length - 1) : 0);
  const [companyName, setCompanyName] = useState(saved.profile?.companyName ?? account?.businesses[0]?.name ?? "");
  const [industry, setIndustry] = useState(saved.profile?.industry ?? "HVAC");
  const [locations, setLocations] = useState(String(saved.profile?.locations ?? 1));
  const [teamSize, setTeamSize] = useState(saved.profile?.teamSize ?? "1–10");
  const [businessHours, setBusinessHours] = useState(saved.profile?.businessHours ?? "Mon–Fri 8am–5pm");
  const [ownerName, setOwnerName] = useState(saved.profile?.ownerName ?? account?.personal.fullName ?? "");
  const [note, setNote] = useState<string | null>(null);

  function onPreview() {
    enterPreviewWorkspace();
    setNote("Demo workspace loaded — all data is labeled sample only.");
    setStep(1);
  }

  function onSkipPreview() {
    setStep(1);
  }

  function onSaveCompany() {
    const profile: CompanyWorkspaceProfile = {
      companyName: companyName.trim() || "My company",
      industry,
      locations: Number(locations) || 1,
      teamSize,
      businessHours,
      ownerName: ownerName.trim() || "Owner",
      adminEmail: account?.email,
    };
    updateCompanyProfile(profile);
    setStep(2);
  }

  function onConnectionsDone() {
    markConnectionsReviewed();
    setStep(3);
  }

  function onTeamDone() {
    markTeamInvited();
    setStep(4);
  }

  function onActivate() {
    const profile: CompanyWorkspaceProfile = {
      companyName: companyName.trim() || "My company",
      industry,
      locations: Number(locations) || 1,
      teamSize,
      businessHours,
      ownerName: ownerName.trim() || "Owner",
      adminEmail: account?.email,
    };
    activateProductionWorkspace(profile);
    setNote("Production workspace activated. Demo data removed.");
    hardNavigate("/app");
  }

  return (
    <div className="training-studio">
      <div className="training-tabs" role="tablist">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={step === i ? "training-tab active" : "training-tab"}
            onClick={() => setStep(i)}
          >
            {label}
          </button>
        ))}
      </div>

      {note ? (
        <div className="memory-card">
          <div className="label">Atlas</div>
          <p>{note}</p>
        </div>
      ) : null}

      {step === 0 ? (
        <section className="panel">
          <h2>1. Preview Atlas</h2>
          <p className="panel-lead">
            Optional guided preview with clearly labeled <strong>Demo Data</strong>. Skip to start with a clean
            production workspace.
          </p>
          <div className="cta-row">
            <button className="btn btn-dark" type="button" onClick={onPreview}>
              Open demo preview
            </button>
            <button className="btn btn-outline" type="button" onClick={onSkipPreview}>
              Skip — production workspace
            </button>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="panel">
          <h2>2. Create your company workspace</h2>
          <div className="form-grid">
            <label>Company name<input value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></label>
            <label>
              Industry
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                {industries.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
            <label>Locations<input type="number" min={1} value={locations} onChange={(e) => setLocations(e.target.value)} /></label>
            <label>Team size<input value={teamSize} onChange={(e) => setTeamSize(e.target.value)} /></label>
            <label>Business hours<input value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} /></label>
            <label>Owner / admin<input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} /></label>
          </div>
          <button className="btn btn-dark" type="button" onClick={onSaveCompany} style={{ marginTop: "1rem" }}>
            Save company profile
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel">
          <h2>3. Connect data</h2>
          <p className="panel-lead">Connect sources so Atlas reasons from real information — not placeholders.</p>
          <div className="list">
            {CONNECTIONS.map((c) => (
              <div key={c.id} className="compliance-row">
                <p><strong>{c.label}</strong></p>
                <Link className="btn btn-outline" href={c.href}>Connect</Link>
              </div>
            ))}
          </div>
          <button className="btn btn-dark" type="button" onClick={onConnectionsDone} style={{ marginTop: "1rem" }}>
            Continue
          </button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="panel">
          <h2>4. Add team</h2>
          <p className="panel-lead">Invite employees, set roles, departments, and permissions.</p>
          <Link className="btn btn-outline" href="/app/workforce">Open Workforce</Link>
          <button className="btn btn-dark" type="button" onClick={onTeamDone} style={{ marginTop: "1rem" }}>
            Continue
          </button>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="panel">
          <h2>5. Activate Atlas</h2>
          <p className="panel-lead">
            Demo records are removed. Dashboards start empty or populate from connections you set up. Demo data cannot
            mix with your production workspace.
          </p>
          <button className="btn btn-dark" type="button" onClick={onActivate}>
            Activate production workspace
          </button>
        </section>
      ) : null}
    </div>
  );
}
