/**
 * Chat route: two-pane direct messages (Firebase RTDB + REST API).
 */
import { Suspense } from "react"
import PageShell from "@/components/PageShell"
import ChatShell from "@/components/chat/ChatShell"

/** Full-viewport chat layout below the navbar. */
export default function ChatPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-neutral-600">
            Loading…
          </div>
        }
      >
        <ChatShell />
      </Suspense>
    </PageShell>
  )
}
