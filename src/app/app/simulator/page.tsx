import { redirect } from "next/navigation";

export default function SimulatorPage() {
  redirect("/app/business-engine?tab=simulate");
}
