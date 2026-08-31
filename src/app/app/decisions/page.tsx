import { redirect } from "next/navigation";

export default function DecisionsPage() {
  redirect("/app/business-engine?tab=decision");
}
