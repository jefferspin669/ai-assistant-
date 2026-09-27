import { redirect } from "next/navigation";

export default function DigitalEmployeesRedirectPage() {
  redirect("/app/workforce?tab=ai-workers");
}
