"use client";

import Link from "@/components/SiteLink";
import { intelligenceFlowSteps } from "@/lib/intelligence-flow";

export function IntelligenceFlowBanner({ activeStep }: { activeStep?: number }) {
  return (
    <section className="panel" style={{ marginBottom: "1rem" }}>
      <h2>Connected Atlas flow</h2>
      <p className="panel-lead">
        One brain across intelligence, decisions, projects, workforce, calendar, automations, and health —
        not isolated AI pages.
      </p>
      <ol className="plain-list" style={{ marginTop: "0.75rem" }}>
        {intelligenceFlowSteps.map((step) => (
          <li key={step.step} style={{ marginBottom: "0.35rem" }}>
            <Link
              href={step.href}
              className={activeStep === step.step ? "badge warn" : undefined}
            >
              {step.step}. {step.label}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
