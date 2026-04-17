/**
 * Events route: week-scoped card grid with the same detail/edit modals as the calendar.
 */
import PageShell from "@/components/PageShell"
import EventsWeekBoard from "@/components/events/EventsWeekBoard"

export default function EventsPage() {
  return (
    <PageShell>
      <EventsWeekBoard />
    </PageShell>
  )
}
