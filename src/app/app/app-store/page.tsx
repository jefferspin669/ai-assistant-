import { redirect } from "next/navigation";

/** App Store merged into Atlas Marketplace. */
export default function AppStoreRedirectPage() {
  redirect("/app/marketplace?tab=developer");
}
