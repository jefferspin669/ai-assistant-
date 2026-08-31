import { redirect } from "next/navigation";

export default function CeoMemoryRedirectPage() {
  redirect("/app/memory?type=leadership");
}
