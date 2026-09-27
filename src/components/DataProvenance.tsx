import { isDemoWorkspace } from "@/lib/workspace-mode";

export function DataProvenance({
  label,
  value,
  source,
  updatedAt,
  emptyMessage,
}: {
  label: string;
  value?: string | null;
  source?: string | null;
  updatedAt?: string | null;
  emptyMessage?: string;
}) {
  const demo = isDemoWorkspace();
  const hasValue = value != null && value !== "" && value !== "—";

  if (!hasValue && !demo) {
    return (
      <div className="stat">
        <span>{label}</span>
        <strong>—</strong>
        <small>{emptyMessage ?? "No data connected yet."}</small>
      </div>
    );
  }

  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{hasValue ? value : "—"}</strong>
      <small>
        {demo ? (
          <span className="badge warn">Demo Data</span>
        ) : source ? (
          <>Source: {source}{updatedAt ? ` · Updated ${updatedAt}` : ""}</>
        ) : (
          "Manual entry"
        )}
      </small>
    </div>
  );
}

export function ProvenanceFooter({
  sources,
  why,
  lastUpdated,
}: {
  sources: string[];
  why?: string;
  lastUpdated?: string;
}) {
  const demo = isDemoWorkspace();
  return (
    <p className="muted-line" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
      {demo ? (
        <span className="badge warn">Demo Data</span>
      ) : null}
      Sources: {demo ? "Demo workspace" : sources.join(" + ")}
      {why ? ` · Why? ${why}` : ""}
      {lastUpdated ? ` · Last updated ${lastUpdated}` : ""}
    </p>
  );
}
