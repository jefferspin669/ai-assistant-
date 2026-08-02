"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CustomizableHome } from "@/components/CustomizableHome";

export default function DashboardPage() {
  return (
    <AppShell
      title="Atlas"
      subtitle="Customizable home — confirmations, connections, contacts, notes, and the rest of your workspace."
      action={
        <div className="cta-row">
          <Link className="btn btn-outline" href="/app/notes">
            Quick capture
          </Link>
          <Link className="btn btn-dark" href="/app/confirmations">
            Confirmations
          </Link>
        </div>
      }
    >
      <CustomizableHome />
    </AppShell>
  );
}
