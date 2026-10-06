import { redirect } from "next/navigation";

/** Automation builder is frozen until invoice-recovery staging proves overnight. */
export default function WorkflowsRedirectPage() {
  redirect("/app/autonomous");
}
