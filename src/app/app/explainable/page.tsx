import { redirect } from "next/navigation";

export default function ExplainablePage() {
  redirect("/app/business-engine?tab=decision");
}
