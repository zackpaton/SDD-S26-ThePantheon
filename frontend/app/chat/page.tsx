/**
 * Chat route: two-pane direct messages (Firebase RTDB + REST API).
 */
import ChatShell from "@/components/chat/ChatShell"

/** Full-viewport chat layout below the navbar. */
export default function ChatPage() {
  return (
    <div className="box-border flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-6">
      <ChatShell />
    </div>
  )
}
