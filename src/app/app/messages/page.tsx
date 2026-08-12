import { AppShell } from "@/components/AppShell";
import { MessagesStudio } from "@/components/MessagesStudio";

export default function MessagesPage() {
  return (
    <AppShell
      title="Messages & Announcements"
      subtitle="Direct messages, team chats, project channels, and company announcements — delivered to each employee's portal."
    >
      <MessagesStudio />
    </AppShell>
  );
}
