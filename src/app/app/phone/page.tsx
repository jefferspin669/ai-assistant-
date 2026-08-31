import { AppShell } from "@/components/AppShell";
import { PhoneReceptionStudio } from "@/components/PhoneReceptionStudio";
import Link from "@/components/SiteLink";

export default function PhonePage() {
  return (
    <AppShell
      title="Phone & Reception"
      subtitle="Business numbers, call routing, voicemail, transcripts, receptionist AI, and missed-call follow-up."
      action={
        <Link className="btn btn-outline" href="/app/chatbot">Customer chatbot</Link>
      }
    >
      <PhoneReceptionStudio />
    </AppShell>
  );
}
