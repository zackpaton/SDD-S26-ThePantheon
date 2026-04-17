/**
 * Chat route: two-pane direct messages (Firebase RTDB + REST API).
 */
import PageShell from "@/components/PageShell"
import ChatShell from "@/components/chat/ChatShell"

/** Full-viewport chat layout below the navbar. */
export default function ChatPage() {
  return (
    <PageShell>
      <ChatShell />
    </PageShell>
  )
}
