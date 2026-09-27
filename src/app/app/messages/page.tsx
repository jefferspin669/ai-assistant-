import { AppShell } from "@/components/AppShell";
import { MessagesStudio } from "@/components/MessagesStudio";

export default function MessagesPage() {
  return (
    <AppShell
      title="Messages"
      subtitle="Direct messages, team and project chats, announcements, and AI summaries — one system for workplace communication."
    >
      <MessagesStudio />
    </AppShell>
  );
}
