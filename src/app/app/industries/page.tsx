import { redirect } from "next/navigation";

export default function IndustriesRedirectPage() {
  redirect("/app/marketplace?tab=industry-packs");
}
