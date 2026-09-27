"use client";

import { useState } from "react";
import { TaxSafetyBanner } from "@/components/TaxCenterAdvanced";
import { TaxCenterStudio, type TaxStudioMode } from "@/components/TaxCenterStudio";
import { TaxLedgerPanel } from "@/components/TaxLedgerPanel";

const SECTIONS: { id: string; label: string; modes?: TaxStudioMode[] }[] = [
  { id: "overview", label: "Overview", modes: ["estimate", "alerts", "review"] },
  { id: "ledger", label: "Ledger" },
  { id: "estimates", label: "Estimates", modes: ["estimate", "quarterly", "income", "expenses", "mileage", "payroll"] },
  { id: "documents", label: "Documents", modes: ["documents", "filing", "interview", "portal"] },
  { id: "settings", label: "Settings", modes: ["tiers", "pro", "safety", "sources"] },
];

export function TaxCenter() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("overview");
  const current = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0];

  return (
    <div className="training-studio">
      <div className="training-tabs" role="tablist" aria-label="Tax Center">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={section === item.id}
            className={section === item.id ? "training-tab active" : "training-tab"}
            onClick={() => setSection(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "overview" ? <TaxSafetyBanner /> : null}
      {section === "overview" || section === "ledger" ? <TaxLedgerPanel /> : null}
      {current.modes ? <TaxCenterStudio key={section} allowedModes={current.modes} /> : null}
    </div>
  );
}
