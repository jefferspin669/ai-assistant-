import { redirect } from "next/navigation";

export default function VoiceRedirectPage() {
  redirect("/app/ask?tab=voice");
}
