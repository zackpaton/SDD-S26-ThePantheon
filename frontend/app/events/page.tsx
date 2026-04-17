/**
 * Events route: week-scoped card grid with the same detail/edit modals as the calendar.
 */
import EventsWeekBoard from "@/components/events/EventsWeekBoard"

export default function EventsPage() {
  return (
    <div className="box-border flex min-h-0 flex-1 flex-col overflow-hidden p-8">
      <EventsWeekBoard />
    </div>
  )
}
