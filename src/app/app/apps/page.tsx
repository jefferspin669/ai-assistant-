import { redirect } from "next/navigation";

/** Apps hub is the Marketplace Discover tab. */
export default function AppsRedirectPage() {
  redirect("/app/marketplace");
}
