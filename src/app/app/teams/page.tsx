import { redirect } from "next/navigation";

export default function TeamsRedirectPage() {
  redirect("/app/workforce?tab=team");
}
