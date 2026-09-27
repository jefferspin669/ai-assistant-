import { redirect } from "next/navigation";

// Static export needs at least one param id. Real meeting ids are client-side;
// this route only redirects to Appointments.
export function generateStaticParams() {
  return [{ id: "demo" }];
}

export default function MeetingDetailRedirectPage() {
  redirect("/app/appointments");
}
