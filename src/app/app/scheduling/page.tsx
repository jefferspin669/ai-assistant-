import { redirect } from "next/navigation";

/** One calendar only — scheduling lives inside Calendar. */
export default function SchedulingPage() {
  redirect("/app/appointments");
}
