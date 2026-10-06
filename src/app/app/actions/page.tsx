import { redirect } from "next/navigation";

/** Demo Actions studio folds into Approvals + Command Center for the invoice beachhead. */
export default function ActionsRedirectPage() {
  redirect("/app/approvals");
}
