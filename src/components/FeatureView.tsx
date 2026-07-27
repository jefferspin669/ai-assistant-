import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export type FeatureStat = { label: string; value: string; detail?: string };

export type FeatureListItem = {
  badge?: string;
  badgeTone?: "ok" | "warn" | "";
  text: string;
  sub?: string;
};

export type FeatureSection =
  | { type: "stats"; items: FeatureStat[] }
  | { type: "split"; left: FeaturePanel; right: FeaturePanel }
  | { type: "panel"; title: string; body?: string; list?: FeatureListItem[]; children?: ReactNode }
  | { type: "chat"; title: string; bubbles: { role: "user" | "ai"; text: string }[] }
  | { type: "table"; title: string; headers: string[]; rows: string[][] }
  | { type: "custom"; node: ReactNode };

export type FeaturePanel = {
  title: string;
  body?: string;
  list?: FeatureListItem[];
  children?: ReactNode;
};

function ListBlock({ list }: { list: FeatureListItem[] }) {
  return (
    <div className="list">
      {list.map((item) => (
        <div className="list-row" key={item.text + (item.sub ?? "")}>
          {item.badge ? (
            <span className={`badge${item.badgeTone === "ok" ? " ok" : item.badgeTone === "warn" ? " warn" : ""}`}>
              {item.badge}
            </span>
          ) : null}
          <div>
            <p>{item.text}</p>
            {item.sub ? <small className="muted-line">{item.sub}</small> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelBlock({ panel }: { panel: FeaturePanel }) {
  return (
    <section className="panel">
      <h2>{panel.title}</h2>
      {panel.body ? <p className="panel-lead">{panel.body}</p> : null}
      {panel.list ? <ListBlock list={panel.list} /> : null}
      {panel.children}
    </section>
  );
}

export function FeatureView({
  title,
  subtitle,
  action,
  sections,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  sections: FeatureSection[];
}) {
  return (
    <AppShell title={title} subtitle={subtitle} action={action}>
      {sections.map((section, index) => {
        if (section.type === "stats") {
          return (
            <div className="stat-grid metrics-dense" key={`stats-${index}`}>
              {section.items.map((stat) => (
                <div className="stat" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                  {stat.detail ? <small>{stat.detail}</small> : null}
                </div>
              ))}
            </div>
          );
        }
        if (section.type === "split") {
          return (
            <div className="split" key={`split-${index}`}>
              <PanelBlock panel={section.left} />
              <PanelBlock panel={section.right} />
            </div>
          );
        }
        if (section.type === "panel") {
          return (
            <PanelBlock
              key={`panel-${index}`}
              panel={{
                title: section.title,
                body: section.body,
                list: section.list,
                children: section.children,
              }}
            />
          );
        }
        if (section.type === "chat") {
          return (
            <section className="panel" key={`chat-${index}`}>
              <h2>{section.title}</h2>
              <div className="chat-mock">
                {section.bubbles.map((bubble, i) => (
                  <div
                    className={`bubble ${bubble.role === "user" ? "bubble-user" : "bubble-ai"}`}
                    key={`${bubble.role}-${i}`}
                  >
                    {bubble.text}
                  </div>
                ))}
              </div>
            </section>
          );
        }
        if (section.type === "table") {
          return (
            <section className="panel" key={`table-${index}`}>
              <h2>{section.title}</h2>
              <table className="table">
                <thead>
                  <tr>
                    {section.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.join("|")}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        }
        return <div key={`custom-${index}`}>{section.node}</div>;
      })}
    </AppShell>
  );
}
