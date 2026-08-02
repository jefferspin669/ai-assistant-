"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/components/AccountProvider";
import { audiences, industries, type Industry } from "@/lib/data";

const personalities = ["Friendly", "Professional", "Funny", "Serious"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { account, updateProfile, aiName, aiPersonality, ownerName, businessName, ready } =
    useAccount();
  const [audience, setAudience] = useState<(typeof audiences)[number]["id"]>("business");
  const [selected, setSelected] = useState<Industry>("HVAC");
  const [name, setName] = useState("Sarah");
  const [personality, setPersonality] = useState<(typeof personalities)[number]>("Friendly");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!ready) return;
    setName(aiName || "Sarah");
    if (personalities.includes(aiPersonality as (typeof personalities)[number])) {
      setPersonality(aiPersonality as (typeof personalities)[number]);
    }
    const biz =
      account?.businesses.find((b) => b.id === account.activeBusinessId) || account?.businesses[0];
    if (biz?.industry && industries.includes(biz.industry as Industry)) {
      setSelected(biz.industry as Industry);
    }
  }, [ready, aiName, aiPersonality, account]);

  const nextHref = useMemo(() => {
    if (audience === "events") return "/app/events";
    if (audience === "individual" || audience === "family" || audience === "school") return "/app/personal";
    if (audience === "nonprofit") return "/app/marketplace";
    return account ? "/app/account" : "/app";
  }, [audience, account]);

  const selectedAudience = audiences.find((a) => a.id === audience)!;

  function onContinue() {
    setSaveError("");
    if (account) {
      const biz =
        account.businesses.find((b) => b.id === account.activeBusinessId) || account.businesses[0];
      const result = updateProfile({
        ownerName: account.personal.fullName || ownerName,
        businessName: biz?.name || businessName,
        industry: selected,
        aiName: name.trim() || "Sarah",
        aiPersonality: personality,
        aiRole: biz?.aiRole || "Office Manager",
      });
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
    }
    router.push(nextHref);
  }

  return (
    <div className="onboard">
      <div className="container">
        <div className="onboard-head">
          <Link href="/" className="logo" style={{ color: "var(--ink)" }}>
            Atlas <span>AI</span>
          </Link>
          <h1>Every business deserves an intelligent workforce, regardless of its size.</h1>
          <p style={{ color: "var(--ink-soft)" }}>
            Don’t just buy software — join a mission. Choose who Atlas helps first. We recommend
            starting with small service businesses, then expanding on the same platform.
          </p>
          {!account ? (
            <p style={{ color: "var(--ink-soft)", marginTop: "0.75rem" }}>
              Want to save your AI name and profile?{" "}
              <Link href="/signup">Create an account</Link> or <Link href="/login">sign in</Link>.
            </p>
          ) : (
            <p style={{ color: "var(--ink-soft)", marginTop: "0.75rem" }}>
              Signed in as {account.email}. Changing the AI name here updates your saved account.
            </p>
          )}
        </div>

        <h3 style={{ marginBottom: "0.75rem" }}>Who is this for?</h3>
        <div className="industry-grid" style={{ marginBottom: "1.25rem" }}>
          {audiences.map((item) => (
            <button
              key={item.id}
              type="button"
              className={audience === item.id ? "industry selected" : "industry"}
              onClick={() => setAudience(item.id)}
            >
              <strong>
                {item.emoji} {item.label}
              </strong>
              <span style={{ display: "block", marginTop: "0.35rem", color: "var(--ink-soft)", fontWeight: 500 }}>
                {item.blurb}
              </span>
              {"beachhead" in item && item.beachhead ? (
                <span className="badge ok" style={{ marginTop: "0.55rem" }}>
                  Beachhead
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {audience === "business" ? (
          <>
            <div className="split" style={{ marginBottom: "1rem" }}>
              <div className="panel">
                <div className="form-grid">
                  <label>
                    AI employee name
                    <input value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <label>
                    Personality
                    <select
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value as typeof personality)}
                    >
                      {personalities.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div className="panel">
                <h3>Preview</h3>
                <div className="chat-mock">
                  <div className="bubble bubble-ai">
                    Hello! Thanks for calling Summit {selected}. I’m {name}. How can I help you today?
                  </div>
                </div>
              </div>
            </div>
            <h3 style={{ marginBottom: "0.75rem" }}>Industry pack</h3>
            <div className="industry-grid">
              {industries.map((industry) => (
                <button
                  key={industry}
                  type="button"
                  className={selected === industry ? "industry selected" : "industry"}
                  onClick={() => setSelected(industry)}
                >
                  <strong>{industry}</strong>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="panel" style={{ marginBottom: "1rem" }}>
            <h3>
              {selectedAudience.emoji} {selectedAudience.label}
            </h3>
            <p style={{ color: "var(--ink-soft)", marginTop: "0.4rem" }}>{selectedAudience.blurb}</p>
          </div>
        )}

        {saveError ? <p className="auth-error">{saveError}</p> : null}

        <button className="btn btn-dark" type="button" onClick={onContinue}>
          Continue to {selectedAudience.label}
        </button>
      </div>
    </div>
  );
}
