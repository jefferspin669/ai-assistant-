import { redirect } from "next/navigation";

export default function CustomerTwinRedirectPage() {
  redirect("/app/memory?type=customer");
}
