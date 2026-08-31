import { redirect } from "next/navigation";

export default function InsightsPage() {
  redirect("/app/business-engine?tab=predictions");
}
