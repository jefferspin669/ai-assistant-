"use client";

import { useMemo } from "react";
import { useAccount } from "@/components/AccountProvider";
import { AtlasChatPanel } from "@/components/AtlasChatPanel";
import { aiEmployees, morningBriefing } from "@/lib/data";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function CommandCenter() {
  const { ownerName, businessName, aiName, aiRole } = useAccount();
  const greeting = useMemo(() => timeGreeting(), []);

  return (
    <div className="command-layout">
      <section className="briefing panel">
        <p className="briefing-kicker">Atlas never sleeps</p>
        <h2>
          {greeting}, {ownerName}.
        </h2>
        <p className="briefing-sub">
          {businessName} · {aiName} is your {aiRole}
        </p>
        <ul className="briefing-list">
          {morningBriefing.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="employee-row">
          {aiEmployees.slice(0, 5).map((employee) => (
            <div className="employee-pill" key={employee.id}>
              <span aria-hidden="true">{employee.emoji}</span>
              <div>
                <strong>{employee.name}</strong>
                <small>{employee.status}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel command-panel">
        <AtlasChatPanel />
      </section>
    </div>
  );
}
