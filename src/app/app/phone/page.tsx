import { AppShell } from "@/components/AppShell";
import { PhoneReceptionStudio } from "@/components/PhoneReceptionStudio";
import Link from "@/components/SiteLink";

export default function PhonePage() {
  return (
    <AppShell
      title="Phone & Reception"
      subtitle="Account Assistant — phone, routing, receptionist AI, control center, and Business Memory."
      action={
        <Link className="btn btn-outline" href="/app/chatbot">Customer chatbot</Link>
      }
    >
      <PhoneReceptionStudio />
    </AppShell>
  );
}
