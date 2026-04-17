/**
 * Consistent horizontal padding and safe-area insets for main app routes (mobile-first).
 */
import type { ReactNode } from "react"

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="box-border flex min-h-0 flex-1 flex-col overflow-hidden px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-8 sm:pb-8">
      {children}
    </div>
  )
}
