"use client";

import { useMemo, useState } from "react";
import { customerDigitalTwins } from "@/lib/atlas-platform";

type Lens =
  | "purchases"
  | "preferences"
  | "service"
  | "satisfaction"
  | "loyalty"
  | "upcoming";

const lenses: { id: Lens; label: string }[] = [
  { id: "purchases", label: "Purchase history" },
  { id: "preferences", label: "Communication" },
  { id: "service", label: "Service history" },
  { id: "satisfaction", label: "Satisfaction" },
  { id: "loyalty", label: "Loyalty" },
  { id: "upcoming", label: "Upcoming needs" },
];

export function CustomerTwinStudio() {
  const [customerId, setCustomerId] = useState<string>(customerDigitalTwins[0].id);
  const [lens, setLens] = useState<Lens>("purchases");
  const [drafted, setDrafted] = useState(false);

  const customer = useMemo(
    () => customerDigitalTwins.find((item) => item.id === customerId) ?? customerDigitalTwins[0],
    [customerId],
  );

  const lensContent = useMemo(() => {
    switch (lens) {
      case "purchases":
        return customer.purchases;
      case "preferences":
        return [customer.preference];
      case "service":
        return customer.serviceHistory;
      case "satisfaction":
        return [
          `Current CSAT ${customer.satisfaction}`,
          `Trend: ${customer.satisfactionTrend.join(" → ")}`,
        ];
      case "loyalty":
        return [`${customer.loyalty} tier`, `Lifetime value ${customer.ltv}`, customer.segment];
      case "upcoming":
        return customer.upcomingNeeds;
      default:
        return [];
    }
  }, [customer, lens]);

  return (
    <div className="training-studio">
      <div className="stat-grid metrics-dense">
        <div className="stat">
          <span>Living profiles</span>
          <strong>{customerDigitalTwins.length}</strong>
          <small>Customer digital twins</small>
        </div>
        <div className="stat">
          <span>LTV</span>
          <strong>{customer.ltv}</strong>
          <small>{customer.name}</small>
        </div>
        <div className="stat">
          <span>Loyalty</span>
          <strong>{customer.loyalty}</strong>
          <small>{customer.segment}</small>
        </div>
        <div className="stat">
          <span>Satisfaction</span>
          <strong>{customer.satisfaction.split(" ")[0]}</strong>
          <small>Latest score</small>
        </div>
      </div>

      <div className="split">
        <section className="panel">
          <h2>Customer Digital Twin</h2>
          <p className="panel-lead">
            Not just contact info — a living profile Atlas uses to personalize every interaction.
          </p>
          <div className="list" style={{ marginTop: "0.85rem" }}>
            {customerDigitalTwins.map((item) => (
              <button
                key={item.id}
                type="button"
                className={customerId === item.id ? "compliance-row active" : "compliance-row"}
                onClick={() => {
                  setCustomerId(item.id);
                  setDrafted(false);
                }}
              >
                <span className={`badge${item.loyalty === "Platinum" || item.loyalty === "Gold" ? " ok" : " warn"}`}>
                  {item.loyalty}
                </span>
                <div>
                  <p>
                    <strong>{item.name}</strong>
                  </p>
                  <small className="muted-line">
                    {item.segment} · LTV {item.ltv}
                  </small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>{customer.name}</h2>
          <p className="panel-lead">{customer.segment}</p>

          <div className="quality-filter-row" style={{ marginBottom: "0.85rem" }}>
            {lenses.map((item) => (
              <button
                key={item.id}
                type="button"
                className={lens === item.id ? "training-tab active" : "training-tab"}
                onClick={() => setLens(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="list">
            {lensContent.map((item) => (
              <div className="list-row" key={item}>
                <span className="badge">Twin</span>
                <p>{item}</p>
              </div>
            ))}
          </div>

          <div className="memory-card" style={{ marginTop: "1rem" }}>
            <div className="label">Personalized interaction</div>
            <p>{customer.personalizedOpener}</p>
            <div className="cta-row" style={{ marginTop: "0.75rem" }}>
              <button
                className="btn btn-dark"
                type="button"
                onClick={() => setDrafted(true)}
              >
                {drafted ? "Draft ready" : "Draft outreach from twin"}
              </button>
            </div>
            {drafted ? (
              <p className="muted-line" style={{ marginTop: "0.65rem" }}>
                Draft queued using preference “{customer.preference}” and upcoming need “
                {customer.upcomingNeeds[0]}”.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
