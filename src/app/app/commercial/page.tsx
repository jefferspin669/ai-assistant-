import { AppShell } from "@/components/AppShell";
import { CommercialStudio } from "@/components/CommercialStudio";

export default function CommercialPage() {
  return (
    <AppShell
      title="Commercial beachhead"
      subtitle="Supabase truth, Twilio receptionist + missed-call recovery, Google/Microsoft calendar, real SMS/invoice sends, and Stripe subscriptions — live when credentials are set."
    >
      <CommercialStudio />
    </AppShell>
  );
}
