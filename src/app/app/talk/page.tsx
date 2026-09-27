import { redirect } from "next/navigation";

export default function TalkRedirectPage() {
  redirect("/app/ask?tab=voice");
}
