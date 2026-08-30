"use client";

import Link from "@/components/SiteLink";
import { useEffect, useRef, useState, useTransition } from "react";
import { atlasCommandHits, globalSearch, type GlobalSearchHit } from "@/lib/global-search";

const EXAMPLES = [
  "Call Johnson Construction",
  "Show overdue invoices",
  "How much did we make last month?",
  "Create an appointment",
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GlobalSearchHit[]>([]);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    startTransition(() => {
      setHits(query.trim() ? globalSearch(query) : []);
    });
  }, [query]);

  return (
    <div className="global-search">
      <button type="button" className="global-search-trigger" onClick={() => setOpen(true)}>
        <span>Ask Atlas or find anything...</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open ? (
        <div className="global-search-overlay" role="dialog" aria-modal="true" aria-label="Global search">
          <button type="button" className="global-search-backdrop" aria-label="Close search" onClick={() => setOpen(false)} />
          <div className="global-search-panel">
            <input
              ref={inputRef}
              className="global-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Atlas or find anything..."
            />
            {!query.trim() ? (
              <div className="global-search-hints">
                <p>Ask Atlas or jump</p>
                <div className="cta-row">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="biz-chip"
                      onClick={() => setQuery(example)}
                    >
                      {example}
                    </button>
                  ))}
                </div>
                <ul className="global-search-results">
                  {atlasCommandHits("").map((hit) => (
                    <li key={hit.id}>
                      <Link href={hit.href} onClick={() => setOpen(false)}>
                        <span className="global-search-source">{hit.source}</span>
                        <strong>{hit.title}</strong>
                        <small>{hit.snippet}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ul className="global-search-results">
              {pending && query.trim() ? <li className="muted">Searching…</li> : null}
              {!pending && query.trim() && !hits.length ? (
                <li className="muted">No matches across calendar, tasks, chats, customers, receipts, files, or invoices.</li>
              ) : null}
              {hits.map((hit) => (
                <li key={`${hit.source}-${hit.id}`}>
                  <Link href={hit.href} onClick={() => setOpen(false)}>
                    <span className="global-search-source">{hit.source}</span>
                    <strong>{hit.title}</strong>
                    <small>{hit.snippet}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
