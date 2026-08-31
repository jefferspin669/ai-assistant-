import { redirect } from "next/navigation";

export default function CalendarHubRedirectPage() {
  redirect("/app/appointments?scope=company&tab=team");
}
