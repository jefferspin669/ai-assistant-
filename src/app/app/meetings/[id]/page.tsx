import { redirect } from "next/navigation";

export default function MeetingDetailRedirectPage() {
  redirect("/app/appointments");
}
