import { redirect } from "next/navigation";

export default function ScorePage() {
  redirect("/app/business-engine?tab=health");
}
