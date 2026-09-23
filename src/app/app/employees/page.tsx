import { redirect } from "next/navigation";

export default function EmployeesRedirectPage() {
  redirect("/app/workforce?tab=ai-workers");
}
