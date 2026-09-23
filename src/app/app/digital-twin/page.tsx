import { redirect } from "next/navigation";

export default function DigitalTwinRedirectPage() {
  redirect("/app/business-engine?tab=simulate");
}
