import { redirect } from "next/navigation";

export default function AssignTasksRedirectPage() {
  redirect("/app/workforce?tab=tasks");
}
