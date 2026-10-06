import { redirect } from "next/navigation";

/** Banking lives under Money — one surface for the money beachhead. */
export default function FinanceRedirectPage() {
  redirect("/app/money");
}
