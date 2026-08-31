import { redirect } from "next/navigation";

/** Confirmations merged into Approvals — keep this path for old bookmarks. */
export default function ConfirmationsRedirectPage() {
  redirect("/app/approvals");
}
