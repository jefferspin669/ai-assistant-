"use client";

import dynamic from "next/dynamic";
import { Suspense, type ReactNode } from "react";

/**
 * Lazy shells for the employee portal. Secondary domains load on demand so the
 * main /employee bundle is not forced to ship every subsystem up front.
 */
export const EmployeeMessagesLazy = dynamic(
  () => import("@/components/employee/EmployeeMessagesPanel").then((m) => m.EmployeeMessagesPanel),
  { ssr: false, loading: () => <p className="muted-line">Loading messages…</p> },
);

export const EmployeeExpensesLazy = dynamic(
  () => import("@/components/employee/EmployeeExpensesPanel").then((m) => m.EmployeeExpensesPanel),
  { ssr: false, loading: () => <p className="muted-line">Loading expenses…</p> },
);

export function EmployeeLazySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <Suspense fallback={<p className="muted-line">Loading…</p>}>{children}</Suspense>
    </section>
  );
}
