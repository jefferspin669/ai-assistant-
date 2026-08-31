import Link from "@/components/SiteLink";

export type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
};

export function EmptyState({
  title,
  description,
  actions = [],
}: {
  title: string;
  description: string;
  actions?: EmptyStateAction[];
}) {
  return (
    <div className="memory-card" style={{ marginTop: "0.5rem" }}>
      <div className="label">Setup</div>
      <p><strong>{title}</strong></p>
      <p className="muted-line">{description}</p>
      {actions.length ? (
        <div className="cta-row" style={{ marginTop: "0.75rem" }}>
          {actions.map((a) =>
            a.href ? (
              <Link key={a.label} className={a.primary ? "btn btn-dark" : "btn btn-outline"} href={a.href}>
                {a.label}
              </Link>
            ) : (
              <button
                key={a.label}
                type="button"
                className={a.primary ? "btn btn-dark" : "btn btn-outline"}
                onClick={a.onClick}
              >
                {a.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
