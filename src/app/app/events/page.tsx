import { redirect } from "next/navigation";

export default function EventsPage() {
  redirect("/app/appointments?tab=events");
}
