import { redirect } from "next/navigation";

export default function TimelineRedirectPage() {
  redirect("/app/customers?tab=timeline");
}
